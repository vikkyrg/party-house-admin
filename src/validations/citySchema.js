import { z } from 'zod';

export const citySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(2, 'Code is required').max(10).toUpperCase(),
  isActive: z.boolean().default(true),
});
