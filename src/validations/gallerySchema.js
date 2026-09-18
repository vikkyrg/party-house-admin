import { z } from 'zod';

export const gallerySchema = z.object({
  title: z.string().optional(),
  category: z.enum(['Home', 'Theater', 'Celebration', 'Other']).default('Home'),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
