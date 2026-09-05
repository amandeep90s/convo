import { z } from 'zod';

export const userSessionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  device_id: z.uuid(),
  refresh_token_hash: z.string().min(1),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  expires_at: z.coerce.date(),
  created_at: z.coerce.date(),
  revoked_at: z.coerce.date().nullable().optional(),
});

export const createUserSessionSchema = z.object({
  device_id: z.uuid(),
  refresh_token_hash: z.string().min(1),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  expires_at: z.coerce.date(),
});

export const updateUserSessionSchema = z.object({
  revoked_at: z.coerce.date().optional(),
  expires_at: z.coerce.date().optional(),
});

// Types
export type UserSession = z.infer<typeof userSessionSchema>;
export type CreateUserSessionDto = z.infer<typeof createUserSessionSchema>;
export type UpdateUserSessionDto = z.infer<typeof updateUserSessionSchema>;
