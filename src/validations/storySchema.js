import { z } from 'zod';

export const storySchema = z.object({
  title: z.string().min(2, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
  shortDescription: z.string().max(300, 'Short description cannot exceed 300 characters').optional(),
  content: z.string().optional(),
  author: z.string().min(2, 'Author name is required').default('Admin'),
  isActive: z.boolean().default(true),
  sections: z.array(
    z.object({
      title: z.string().min(2, 'Section title is required'),
      description: z.string().min(5, 'Section description is required'),
      image: z.any().optional(), // File object or string (existing image)
    })
  ).optional()
});
