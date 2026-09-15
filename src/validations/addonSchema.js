import { z } from 'zod';

export const addonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});
