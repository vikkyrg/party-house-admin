import { z } from 'zod';

export const locationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  pincode: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});
