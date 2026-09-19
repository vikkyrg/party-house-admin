import { z } from 'zod';

export const theaterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional().or(z.literal('')),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(5, 'Address is required'),
  googleMapsLink: z.union([z.literal(''), z.string().url('Must be a valid URL')]).optional(),
  capacity: z.number().min(1).max(100).optional(),
  pricePerHour: z.number().min(0).optional(),
  additionalGuestPrice: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});
