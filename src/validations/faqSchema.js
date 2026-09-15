import { z } from 'zod';

export const faqSchema = z.object({
  question: z.string().min(5, 'Question is required').max(200),
  answer: z.string().min(10, 'Answer must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});
