import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendNotFound } from '../../utils/response';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  sendSuccess(res, notifications, 'Notifications retrieved', 200, {
    total,
    unreadCount,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    totalPages: Math.ceil(total / parseInt(limit as string)),
  });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.userId;

  const notif = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notif) {
    sendNotFound(res, 'Notification not found');
    return;
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  sendSuccess(res, null, 'Notification marked as read');
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  sendSuccess(res, null, 'All notifications marked as read');
}
