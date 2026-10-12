import { z } from 'zod';

export const gallerySchema = z.object({
  title: z.string().optional(),
  category: z.enum(['Home', 'Theater', 'Celebration', 'Other']).default('Home'),
  isActive: z.boolean().default(true),
});
