import { z } from 'zod';

import { VISIBILITIES } from '../enums/user-settings.js';

export const visibilitySchema = z.enum(VISIBILITIES);

export const userSettingsSchema = z.object({
  user_id: z.uuid(),
  language: z.string().trim().min(2).max(10),
  theme: z.string().trim().min(1).max(20),
  read_receipts: z.boolean(),
  last_seen_visibility: visibilitySchema,
  online_visibility: visibilitySchema,
  profile_visibility: visibilitySchema,
  notification_enabled: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const createUserSettingsSchema = z.object({
  language: z.string().trim().min(2).max(10).optional(),
  theme: z.string().trim().min(1).max(20).optional(),
  read_receipts: z.boolean().optional(),
  last_seen_visibility: visibilitySchema.optional(),
  online_visibility: visibilitySchema.optional(),
  profile_visibility: visibilitySchema.optional(),
  notification_enabled: z.boolean().optional(),
});

export const updateUserSettingsSchema = createUserSettingsSchema;

// Types
export type Visibility = z.infer<typeof visibilitySchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type CreateUserSettingsDto = z.infer<typeof createUserSettingsSchema>;
export type UpdateUserSettingsDto = z.infer<typeof updateUserSettingsSchema>;
