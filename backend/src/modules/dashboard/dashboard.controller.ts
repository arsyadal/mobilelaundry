import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayOrders,
    todayRevenue,
    pendingOrders,
    monthOrders,
    monthRevenue,
    lastMonthRevenue,
    totalCustomers,
    statusBreakdown,
    recentOrders,
  ] = await Promise.all([
    // Today's order count
    prisma.order.count({
      where: { createdAt: { gte: startOfToday, lt: endOfToday } },
    }),
    // Today's revenue (completed orders)
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfToday, lt: endOfToday },
        status: { in: ['DONE', 'COMPLETED'] },
      },
      _sum: { totalPrice: true },
    }),
    // Pending orders count
    prisma.order.count({ where: { status: 'PENDING' } }),
    // This month order count
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    // This month revenue
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        status: { in: ['DONE', 'COMPLETED'] },
      },
      _sum: { totalPrice: true },
    }),
    // Last month revenue (for comparison)
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfLastMonth, lt: endOfLastMonth },
        status: { in: ['DONE', 'COMPLETED'] },
      },
      _sum: { totalPrice: true },
    }),
    // Total customers
    prisma.user.count({ where: { role: 'PELANGGAN' } }),
    // Order status breakdown
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    // Recent 5 orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        payment: { select: { status: true, method: true } },
      },
    }),
  ]);

  const currentMonthRevenue = monthRevenue._sum.totalPrice || 0;
  const prevMonthRevenue = lastMonthRevenue._sum.totalPrice || 0;
  const revenueGrowth = prevMonthRevenue > 0
    ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
    : 0;

  sendSuccess(res, {
    today: {
      orders: todayOrders,
      revenue: todayRevenue._sum.totalPrice || 0,
    },
    month: {
      orders: monthOrders,
      revenue: currentMonthRevenue,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
    },
    pending: pendingOrders,
    totalCustomers,
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
    recentOrders,
  });
}
