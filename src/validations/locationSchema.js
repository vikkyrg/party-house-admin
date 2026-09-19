import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  displayName: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  area: z.string().optional().or(z.literal('')),
  cityName: z.string().optional().or(z.literal('')),
  stateName: z.string().optional().or(z.literal('')),
  countryName: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().or(z.literal('')),
  googleMapLink: z.union([z.literal(''), z.string().url('Must be a valid URL')]).optional(),
  description: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});
