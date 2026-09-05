import { z } from 'zod';

export const privateConversationSchema = z.object({
  conversation_id: z.uuid(),
  user_a_id: z.uuid(),
  user_b_id: z.uuid(),
  pair_key: z.string().max(73),
});

export const createPrivateConversationSchema = z.object({
  user_a_id: z.uuid(),
  user_b_id: z.uuid(),
});

// Types
export type PrivateConversation = z.infer<typeof privateConversationSchema>;
export type CreatePrivateConversationDto = z.infer<typeof createPrivateConversationSchema>;
