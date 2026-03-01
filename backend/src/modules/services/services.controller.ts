import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendCreated, sendNotFound } from '../../utils/response';

export async function listServices(req: Request, res: Response): Promise<void> {
  const showAll = req.user?.role === 'ADMIN';
  const services = await prisma.laundryService.findMany({
    where: showAll ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
  sendSuccess(res, services);
}

export async function createService(req: Request, res: Response): Promise<void> {
  const { name, pricePerKg, isActive } = req.body;
  const service = await prisma.laundryService.create({
    data: { name, pricePerKg, isActive },
  });
  sendCreated(res, service, 'Service created');
}

export async function updateService(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, pricePerKg, isActive } = req.body;

  const existing = await prisma.laundryService.findUnique({ where: { id } });
  if (!existing) {
    sendNotFound(res, 'Service not found');
    return;
  }

  const service = await prisma.laundryService.update({
    where: { id },
    data: { name, pricePerKg, isActive },
  });
  sendSuccess(res, service, 'Service updated');
}

export async function toggleService(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.laundryService.findUnique({ where: { id } });
  if (!existing) {
    sendNotFound(res, 'Service not found');
    return;
  }

  const service = await prisma.laundryService.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  sendSuccess(res, service, `Service ${service.isActive ? 'activated' : 'deactivated'}`);
}
