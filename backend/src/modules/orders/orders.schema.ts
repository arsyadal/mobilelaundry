import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      serviceId: z.string().min(1, 'Service ID is required'),
      weightKg: z.number().positive('Weight must be positive'),
    })
  ).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER']),
  estimatedWeight: z.number().positive('Estimated weight must be positive'),
  pickupAddress: z.string().min(5, 'Pickup address is required'),
  notes: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'DONE', 'COMPLETED', 'CANCELLED']),
  note: z.string().optional(),
});

export const updateWeightSchema = z.object({
  actualWeight: z.number().positive('Weight must be positive'),
});
