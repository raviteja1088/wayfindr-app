import { z } from 'zod';

// Bus location validation schema
export const busLocationSchema = z.object({
  bus_id: z.string().uuid('Invalid bus ID'),
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
  speed: z.number().min(0, 'Speed must be non-negative').max(200, 'Speed must be <= 200 km/h').nullable(),
  heading: z.number().min(0, 'Heading must be >= 0').max(360, 'Heading must be <= 360 degrees').nullable(),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').nullable().optional(),
  stop_name: z.string().max(200, 'Stop name must be less than 200 characters').nullable().optional(),
  stop_latitude: z.number().min(-90).max(90).nullable().optional(),
  stop_longitude: z.number().min(-180).max(180).nullable().optional(),
});

// Bus management validation schema
export const busSchema = z.object({
  bus_number: z.string().min(1, 'Bus number is required').max(50, 'Bus number must be less than 50 characters'),
  route_name: z.string().min(1, 'Route name is required').max(200, 'Route name must be less than 200 characters'),
  driver_id: z.string().uuid('Invalid driver ID').nullable().optional(),
  is_active: z.boolean().optional(),
});

// Stop validation schema
export const stopSchema = z.object({
  bus_id: z.string().uuid('Invalid bus ID'),
  stop_name: z.string().min(1, 'Stop name is required').max(200, 'Stop name must be less than 200 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  stop_order: z.number().int('Stop order must be an integer').min(1, 'Stop order must be positive'),
});
