import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendNotFound } from '../../utils/response';

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '20', search } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: Record<string, unknown> = { role: 'PELANGGAN' };
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { email: { contains: search as string } },
      { phone: { contains: search as string } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, users, 'Customers retrieved', 200, {
    total,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    totalPages: Math.ceil(total / parseInt(limit as string)),
  });
}

export async function getCustomerDetail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const user = await prisma.user.findFirst({
    where: { id, role: 'PELANGGAN' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      createdAt: true,
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { payment: true },
      },
    },
  });

  if (!user) {
    sendNotFound(res, 'Customer not found');
    return;
  }

  sendSuccess(res, user);
}
