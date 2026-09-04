import { z } from 'zod';

import { CONVERSATION_TYPES } from '../enums/conversation.js';

export const conversationTypeSchema = z.enum(CONVERSATION_TYPES);

export const conversationSchema = z.object({
  id: z.uuid(),
  type: conversationTypeSchema,
  name: z.string().max(100).nullable().optional(),
  avatar_url: z.url().nullable().optional(),
  created_by: z.uuid(),
  last_message_id: z.uuid().nullable().optional(),
  last_message_at: z.coerce.date().nullable().optional(),
  disappearing_message_ttl_seconds: z.number().int().positive().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  deleted_at: z.coerce.date().nullable().optional(),
});

export const createConversationSchema = z.object({
  type: conversationTypeSchema,
  name: z.string().max(100).optional(),
  avatar_url: z.url().optional(),
  disappearing_message_ttl_seconds: z.number().int().positive().optional(),
});

export const updateConversationSchema = z.object({
  name: z.string().max(100).optional(),
  avatar_url: z.url().optional(),
  disappearing_message_ttl_seconds: z.number().int().positive().nullable().optional(),
});

// Types
export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationType = z.infer<typeof conversationTypeSchema>;
export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type UpdateConversationDto = z.infer<typeof updateConversationSchema>;
