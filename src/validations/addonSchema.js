import { z } from 'zod';

export const addonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  price1Hour: z.number().min(0, '1 Hour Price must be positive'),
  price2Hours: z.number().min(0, '2 Hours Price must be positive'),
  price3Hours: z.number().min(0, '3 Hours Price must be positive'),
  category: z.literal('Special Services').or(z.enum(['Special Services'])),
  isActive: z.boolean().default(true),
});
