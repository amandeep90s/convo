import { z } from 'zod';

export const groupSchema = z.object({
  conversation_id: z.uuid(),
  description: z.string().nullable().optional(),
  created_by: z.uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().optional(),
  avatar_url: z.url().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().optional(),
  avatar_url: z.url().nullable().optional(),
});

// Types
export type Group = z.infer<typeof groupSchema>;
export type CreateGroupDto = z.infer<typeof createGroupSchema>;
export type UpdateGroupDto = z.infer<typeof updateGroupSchema>;
