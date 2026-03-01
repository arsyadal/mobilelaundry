import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { signToken } from '../../utils/jwt';
import { sendSuccess, sendCreated, sendError, sendUnauthorized, sendNotFound } from '../../utils/response';

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, phone, address } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    sendError(res, 'Email already registered', 409);
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone, address, role: 'PELANGGAN' },
    select: { id: true, name: true, email: true, role: true, phone: true, address: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  sendCreated(res, { user, token }, 'Registration successful');
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    sendUnauthorized(res, 'Invalid email or password');
    return;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    sendUnauthorized(res, 'Invalid email or password');
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { passwordHash: _, ...userWithoutPassword } = user;

  sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, phone: true, address: true, expoPushToken: true, createdAt: true },
  });

  if (!user) {
    sendNotFound(res, 'User not found');
    return;
  }

  sendSuccess(res, user);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const { name, phone, address, currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }
    if (!currentPassword) {
      sendError(res, 'Current password is required to set a new password', 400);
      return;
    }
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (newPassword) updateData.passwordHash = await hashPassword(newPassword);

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, phone: true, address: true, createdAt: true },
  });

  sendSuccess(res, user, 'Profile updated');
}

export async function saveExpoToken(req: Request, res: Response): Promise<void> {
  const { expoPushToken } = req.body;
  if (!expoPushToken) {
    sendError(res, 'expoPushToken is required');
    return;
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { expoPushToken },
  });

  sendSuccess(res, null, 'Expo push token saved');
}
