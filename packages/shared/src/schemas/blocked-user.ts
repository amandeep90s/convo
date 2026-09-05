import { z } from 'zod';

export const blockedUserSchema = z.object({
  user_id: z.uuid(),
  blocked_user_id: z.uuid(),
  created_at: z.coerce.date(),
});

export const createBlockedUserSchema = z.object({
  blocked_user_id: z.uuid(),
});

// Types
export type BlockedUser = z.infer<typeof blockedUserSchema>;
export type CreateBlockedUserDto = z.infer<typeof createBlockedUserSchema>;
