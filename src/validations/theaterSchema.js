import { z } from 'zod';

export const theaterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string().min(1, 'City is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(5, 'Address is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(50),
  pricePerHour: z.number().min(0, 'Price must be positive'),
  eventTypes: z.array(z.string()).min(1, 'Select at least one event type'),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});
