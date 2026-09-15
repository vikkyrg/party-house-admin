import { z } from 'zod';

export const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  position: z.string().default('home-hero'),
  priority: z.number().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});
