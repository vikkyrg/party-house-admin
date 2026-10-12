import { z } from 'zod';

export const serviceSchema = z.object({
  title: z.string().min(2, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  features: z.string().optional(), // Will be parsed/split into an array before sending
  isActive: z.boolean().default(true),
});
