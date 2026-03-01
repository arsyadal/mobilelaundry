import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendNotFound, sendError } from '../../utils/response';
import { sendPushNotification } from '../../utils/expoPush';

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED: 'Order Anda telah dikonfirmasi dan akan segera diproses.',
  PROCESSING: 'Laundry Anda sedang dalam proses pencucian.',
  DONE: 'Laundry Anda sudah selesai dan siap diambil/diantarkan.',
  COMPLETED: 'Order selesai. Terima kasih telah menggunakan layanan kami!',
  CANCELLED: 'Order Anda telah dibatalkan.',
};

export async function getAllOrders(req: Request, res: Response): Promise<void> {
  const { status, page = '1', limit = '20', date } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (date) {
    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    where.createdAt = { gte: startDate, lt: endDate };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        items: { include: { service: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.order.count({ where }),
  ]);

  sendSuccess(res, orders, 'Orders retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    totalPages: Math.ceil(total / parseInt(limit as string)),
  });
}

export async function getOrderDetail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true, address: true } },
      items: { include: { service: true } },
      payment: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });

  if (!order) {
    sendNotFound(res, 'Order not found');
    return;
  }

  sendSuccess(res, order);
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, note } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!order) {
    sendNotFound(res, 'Order not found');
    return;
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: { status, note: note || STATUS_MESSAGES[status] || 'Status updated' },
      },
    },
    include: {
      items: { include: { service: true } },
      payment: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });

  // Save notification in DB
  await prisma.notification.create({
    data: {
      userId: order.customerId,
      title: `Update Order ${order.orderNumber}`,
      body: STATUS_MESSAGES[status] || `Status order berubah menjadi ${status}`,
      data: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber }),
    },
  });

  // Send push notification if customer has token
  if (order.customer.expoPushToken) {
    sendPushNotification({
      to: order.customer.expoPushToken,
      title: `Update Order ${order.orderNumber}`,
      body: STATUS_MESSAGES[status] || `Status order berubah menjadi ${status}`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    }).catch(console.error);
  }

  sendSuccess(res, updatedOrder, 'Order status updated');
}

export async function updateActualWeight(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { actualWeight } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { service: true } } },
  });

  if (!order) {
    sendNotFound(res, 'Order not found');
    return;
  }

  if (!['CONFIRMED', 'PROCESSING'].includes(order.status)) {
    sendError(res, 'Can only update weight for confirmed or processing orders', 400);
    return;
  }

  // Recalculate total price based on actual weight proportionally
  const estimatedWeight = order.estimatedWeight;
  const ratio = actualWeight / estimatedWeight;
  const newTotalPrice = order.items.reduce((sum, item) => {
    const newWeight = parseFloat((item.weightKg * ratio).toFixed(2));
    return sum + item.pricePerKg * newWeight;
  }, 0);

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      actualWeight,
      totalPrice: Math.round(newTotalPrice),
    },
    include: {
      items: { include: { service: true } },
      payment: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });

  sendSuccess(res, updatedOrder, 'Actual weight updated and price recalculated');
}
