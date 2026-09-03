import { z } from 'zod';

import { MESSAGE_DELETION_KINDS, MESSAGE_TYPES } from '../enums/message.js';

export const messageTypeSchema = z.enum(MESSAGE_TYPES);

export const messageDeletionKindSchema = z.enum(MESSAGE_DELETION_KINDS);

const bigIntInputSchema = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]);

export const messageSchema = z.object({
  id: z.uuid(),
  conversation_id: z.uuid(),
  sender_id: z.uuid(),
  reply_to_id: z.uuid().nullable().optional(),
  type: messageTypeSchema,
  content: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  edited_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.uuid().nullable().optional(),
  deletion_kind: messageDeletionKindSchema.nullable().optional(),
  expires_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  deleted_at: z.coerce.date().nullable().optional(),
});

export const createMessageSchema = z.object({
  conversation_id: z.uuid(),
  reply_to_id: z.uuid().optional(),
  type: messageTypeSchema,
  content: z.string().max(10000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expires_at: z.coerce.date().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().max(10000),
});

export const deleteMessageSchema = z.object({
  deletion_kind: messageDeletionKindSchema,
});

export const messageAttachmentSchema = z.object({
  id: z.uuid(),
  message_id: z.uuid(),
  type: messageTypeSchema,
  storage_key: z.string().min(1),
  mime_type: z.string().min(1).max(100),
  file_name: z.string().max(255).nullable().optional(),
  file_size: bigIntInputSchema.nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  duration_ms: bigIntInputSchema.nullable().optional(),
  thumbnail_key: z.string().nullable().optional(),
  created_at: z.coerce.date(),
});

export const createMessageAttachmentSchema = z.object({
  message_id: z.uuid(),
  type: messageTypeSchema,
  storage_key: z.string().min(1),
  mime_type: z.string().min(1).max(100),
  file_name: z.string().max(255).optional(),
  file_size: bigIntInputSchema.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration_ms: bigIntInputSchema.optional(),
  thumbnail_key: z.string().optional(),
});

export const messageReactionSchema = z.object({
  message_id: z.uuid(),
  user_id: z.uuid(),
  emoji: z.string().min(1).max(20),
  created_at: z.coerce.date(),
});

export const createMessageReactionSchema = z.object({
  message_id: z.uuid(),
  emoji: z.string().min(1).max(20),
});

export const messageReceiptSchema = z.object({
  message_id: z.uuid(),
  user_id: z.uuid(),
  delivered_at: z.coerce.date().nullable().optional(),
  read_at: z.coerce.date().nullable().optional(),
});

export const createMessageReceiptSchema = z.object({
  message_id: z.uuid(),
});

export const updateMessageReceiptSchema = z.object({
  delivered_at: z.coerce.date().optional(),
  read_at: z.coerce.date().optional(),
});

export const pinnedMessageSchema = z.object({
  conversation_id: z.uuid(),
  message_id: z.uuid(),
  pinned_by: z.uuid(),
  pinned_at: z.coerce.date(),
});

export const createPinnedMessageSchema = z.object({
  message_id: z.uuid(),
});
