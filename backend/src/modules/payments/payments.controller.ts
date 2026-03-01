import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError, sendNotFound } from '../../utils/response';

export async function uploadPaymentProof(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const customerId = req.user!.userId;

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    include: { payment: true },
  });

  if (!order) {
    sendNotFound(res, 'Order not found');
    return;
  }

  if (!order.payment) {
    sendNotFound(res, 'Payment record not found');
    return;
  }

  if (order.payment.method !== 'BANK_TRANSFER') {
    sendError(res, 'Payment proof is only required for bank transfer orders', 400);
    return;
  }

  if (order.payment.status === 'CONFIRMED') {
    sendError(res, 'Payment already confirmed', 400);
    return;
  }

  if (!req.file) {
    sendError(res, 'Payment proof image is required', 400);
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const proofImageUrl = `${appUrl}/uploads/${req.file.filename}`;

  const payment = await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      proofImageUrl,
      status: 'WAITING_CONFIRMATION',
    },
  });

  sendSuccess(res, payment, 'Payment proof uploaded. Waiting for admin confirmation.');
}
