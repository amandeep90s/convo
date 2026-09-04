import { z } from 'zod';

import { MEMBER_ROLES, NOTIFICATION_POLICIES } from '../enums/conversation-member.js';

export const memberRoleSchema = z.enum(MEMBER_ROLES);
export const notificationPolicySchema = z.enum(NOTIFICATION_POLICIES);

export const conversationMemberSchema = z.object({
  conversation_id: z.uuid(),
  user_id: z.uuid(),
  role: memberRoleSchema,
  joined_at: z.coerce.date(),
  left_at: z.coerce.date().nullable().optional(),
  muted_until: z.coerce.date().nullable().optional(),
  notification_policy: notificationPolicySchema,
  archived_at: z.coerce.date().nullable().optional(),
  last_read_message_id: z.uuid().nullable().optional(),
  created_at: z.coerce.date(),
});

export const createConversationMemberSchema = z.object({
  user_id: z.uuid(),
  role: memberRoleSchema.optional(),
});

export const updateConversationMemberSchema = z.object({
  role: memberRoleSchema.optional(),
  left_at: z.coerce.date().optional(),
  muted_until: z.coerce.date().nullable().optional(),
  notification_policy: notificationPolicySchema.optional(),
  archived_at: z.coerce.date().nullable().optional(),
  last_read_message_id: z.uuid().optional(),
});

// Types
export type ConversationMember = z.infer<typeof conversationMemberSchema>;
export type CreateConversationMemberDto = z.infer<typeof createConversationMemberSchema>;
export type UpdateConversationMemberDto = z.infer<typeof updateConversationMemberSchema>;
