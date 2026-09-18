import { z } from 'zod';

export const reviewSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  theater: z.string().nullable().optional(),
  rating: z.coerce.number().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1500, 'Review cannot exceed 1500 characters'),
  mediaType: z.enum(['none', 'image', 'video', 'link']),
  mediaUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});
