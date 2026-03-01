import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { generateOrderNumber } from '../../utils/orderNumber';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../../utils/response';

export async function createOrder(req: Request, res: Response): Promise<void> {
  const { items, paymentMethod, estimatedWeight, pickupAddress, notes } = req.body;
  const customerId = req.user!.userId;

  // Verify all services exist and are active
  const serviceIds = items.map((i: { serviceId: string }) => i.serviceId);
  const services = await prisma.laundryService.findMany({
    where: { id: { in: serviceIds }, isActive: true },
  });

  if (services.length !== serviceIds.length) {
    sendError(res, 'One or more services not found or inactive', 400);
    return;
  }

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  // Calculate order items with price snapshot
  const orderItems = items.map((item: { serviceId: string; weightKg: number }) => {
    const service = serviceMap.get(item.serviceId)!;
    const subtotal = service.pricePerKg * item.weightKg;
    return {
      serviceId: item.serviceId,
      weightKg: item.weightKg,
      pricePerKg: service.pricePerKg,
      subtotal,
    };
  });

  const totalPrice = orderItems.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
  const orderNumber = await generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      paymentMethod,
      totalPrice,
      estimatedWeight,
      pickupAddress,
      notes,
      items: { create: orderItems },
      payment: {
        create: {
          method: paymentMethod,
          status: 'UNPAID',
        },
      },
      statusHistory: {
        create: {
          status: 'PENDING',
          note: 'Order placed',
        },
      },
    },
    include: {
      items: { include: { service: true } },
      payment: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });

  sendCreated(res, order, 'Order created successfully');
}

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  const customerId = req.user!.userId;
  const { status, page = '1', limit = '10' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: Record<string, unknown> = { customerId };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
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

export async function getMyOrderDetail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const customerId = req.user!.userId;

  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
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
