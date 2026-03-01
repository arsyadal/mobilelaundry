import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError, sendNotFound } from '../../utils/response';
import { sendPushNotification } from '../../utils/expoPush';

export async function confirmPayment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        include: { customer: true },
      },
    },
  });

  if (!payment) {
    sendNotFound(res, 'Payment not found');
    return;
  }

  if (payment.status !== 'WAITING_CONFIRMATION') {
    sendError(res, 'Payment is not waiting for confirmation', 400);
    return;
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  const notifBody = `Pembayaran untuk order ${payment.order.orderNumber} telah dikonfirmasi.`;

  await prisma.notification.create({
    data: {
      userId: payment.order.customerId,
      title: 'Pembayaran Dikonfirmasi',
      body: notifBody,
      data: JSON.stringify({ orderId: payment.orderId }),
    },
  });

  if (payment.order.customer.expoPushToken) {
    sendPushNotification({
      to: payment.order.customer.expoPushToken,
      title: 'Pembayaran Dikonfirmasi',
      body: notifBody,
      data: { orderId: payment.orderId },
    }).catch(console.error);
  }

  sendSuccess(res, updatedPayment, 'Payment confirmed');
}

export async function rejectPayment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        include: { customer: true },
      },
    },
  });

  if (!payment) {
    sendNotFound(res, 'Payment not found');
    return;
  }

  if (payment.status !== 'WAITING_CONFIRMATION') {
    sendError(res, 'Payment is not waiting for confirmation', 400);
    return;
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedReason: reason || 'Bukti pembayaran tidak valid',
    },
  });

  const notifBody = `Bukti pembayaran untuk order ${payment.order.orderNumber} ditolak. ${reason ? `Alasan: ${reason}` : 'Silakan upload ulang bukti yang valid.'}`;

  await prisma.notification.create({
    data: {
      userId: payment.order.customerId,
      title: 'Pembayaran Ditolak',
      body: notifBody,
      data: JSON.stringify({ orderId: payment.orderId }),
    },
  });

  if (payment.order.customer.expoPushToken) {
    sendPushNotification({
      to: payment.order.customer.expoPushToken,
      title: 'Pembayaran Ditolak',
      body: notifBody,
      data: { orderId: payment.orderId },
    }).catch(console.error);
  }

  sendSuccess(res, updatedPayment, 'Payment rejected');
}
