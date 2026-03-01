import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  pricePerKg: z.number().positive('Price must be positive'),
  isActive: z.boolean().optional().default(true),
});
