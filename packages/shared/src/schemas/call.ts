import { z } from 'zod';

import { CALL_STATUSES, CALL_TYPES } from '../constants/call.js';

export const callTypeSchema = z.enum(CALL_TYPES);
export const callStatusSchema = z.enum(CALL_STATUSES);

export const callSchema = z.object({
  id: z.uuid(),
  conversation_id: z.uuid(),
  initiated_by: z.uuid(),
  type: callTypeSchema,
  status: callStatusSchema,
  started_at: z.coerce.date().nullable().optional(),
  ended_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
});

export const createCallSchema = z.object({
  conversation_id: z.uuid(),
  type: callTypeSchema,
});

export const updateCallSchema = z.object({
  status: callStatusSchema.optional(),
  started_at: z.coerce.date().optional(),
  ended_at: z.coerce.date().optional(),
});

export const callParticipantSchema = z.object({
  call_id: z.uuid(),
  user_id: z.uuid(),
  joined_at: z.coerce.date().nullable().optional(),
  left_at: z.coerce.date().nullable().optional(),
});

export const createCallParticipantSchema = z.object({
  user_id: z.uuid(),
});

export const updateCallParticipantSchema = z.object({
  joined_at: z.coerce.date().optional(),
  left_at: z.coerce.date().optional(),
});

// Types
export type Call = z.infer<typeof callSchema>;
export type CreateCallDto = z.infer<typeof createCallSchema>;
export type UpdateCallDto = z.infer<typeof updateCallSchema>;
export type CallParticipant = z.infer<typeof callParticipantSchema>;
export type CreateCallParticipantDto = z.infer<typeof createCallParticipantSchema>;
export type UpdateCallParticipantDto = z.infer<typeof updateCallParticipantSchema>;
