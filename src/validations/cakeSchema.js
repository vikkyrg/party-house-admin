import { z } from 'zod';

export const cakeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['standard', 'premium']),
  sizes: z.array(z.object({
    name: z.string().min(1, 'Size ID is required'),
    label: z.string().min(1, 'Size label is required'),
    price: z.coerce.number().min(0, 'Price must be non-negative')
  })).min(1, 'At least one size is required').superRefine((sizes, ctx) => {
    const names = sizes.map((size) => size.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Size variants must be unique' });
    }
  }),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});
