import { z } from 'zod';

export const theaterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string().min(1, 'City is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(5, 'Address is required'),
  googleMapsLink: z.union([z.literal(''), z.string().url('Must be a valid URL')]).optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(50),
  pricePerHour: z.number().min(0, 'Price must be positive'),
  additionalGuestPrice: z.number().min(0, 'Price must be positive').default(0),
  theatreVideoUrl: z.union([z.literal(''), z.string().url('Must be a valid URL')]).optional(),
  branchVideoUrl: z.union([z.literal(''), z.string().url('Must be a valid URL')]).optional(),
  eventTypes: z.array(z.string()).min(1, 'Select at least one event type'),
  slots: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});
