import { z } from 'zod';

export const testimonialSchema = z.object({
  customerName: z.string().min(1, 'Name is required').max(100),
  text: z.string().min(10, 'Testimonial text must be at least 10 characters'),
  rating: z.number().min(1).max(5),
  theater: z.string().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});
