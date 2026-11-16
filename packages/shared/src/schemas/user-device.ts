import { z } from 'zod';

import { DEVICE_TYPES } from '../constants/user-device.js';
import { dateTimeSchema } from './common.js';

export const deviceTypeSchema = z.enum(DEVICE_TYPES);

export const userDeviceSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  device_type: deviceTypeSchema,
  device_name: z.string().max(100).nullable().optional(),
  push_token: z.string().nullable().optional(),
  public_key: z.string().nullable().optional(),
  last_seen_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  revoked_at: z.coerce.date().nullable().optional(),
});

export const createUserDeviceSchema = z.object({
  device_type: deviceTypeSchema,
  device_name: z.string().max(100).optional(),
  push_token: z.string().optional(),
  public_key: z.string().optional(),
});

export const updateUserDeviceSchema = z.object({
  device_name: z.string().max(100).optional(),
  push_token: z.string().optional(),
  public_key: z.string().optional(),
  last_seen_at: dateTimeSchema.optional(),
});

// Types
export type DeviceType = z.infer<typeof deviceTypeSchema>;
export type UserDevice = z.infer<typeof userDeviceSchema>;
export type CreateUserDeviceDto = z.infer<typeof createUserDeviceSchema>;
export type UpdateUserDeviceDto = z.infer<typeof updateUserDeviceSchema>;
