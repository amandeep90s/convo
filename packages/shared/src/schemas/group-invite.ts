import { z } from 'zod';

import { dateTimeSchema } from './common.js';

export const groupInviteSchema = z.object({
  id: z.uuid(),
  conversation_id: z.uuid(),
  code: z.string().max(64),
  created_by: z.uuid(),
  expires_at: z.coerce.date().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  use_count: z.number().int().nonnegative(),
  revoked_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const createGroupInviteSchema = z.object({
  expires_at: dateTimeSchema.optional(),
  max_uses: z.number().int().positive().optional(),
});

export const updateGroupInviteSchema = z.object({
  expires_at: dateTimeSchema.nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  revoked_at: dateTimeSchema.optional(),
});

// Types
export type GroupInvite = z.infer<typeof groupInviteSchema>;
export type CreateGroupInviteDto = z.infer<typeof createGroupInviteSchema>;
export type UpdateGroupInviteDto = z.infer<typeof updateGroupInviteSchema>;
