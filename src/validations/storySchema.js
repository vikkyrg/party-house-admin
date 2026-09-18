import { z } from 'zod';

export const storySchema = z.object({
  title: z.string().min(2, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  author: z.string().min(2, 'Author name is required').default('Admin'),
  isActive: z.boolean().default(true),
});
