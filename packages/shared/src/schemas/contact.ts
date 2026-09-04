import { z } from 'zod';

export const contactSchema = z.object({
  user_id: z.uuid(),
  contact_user_id: z.uuid(),
  nickname: z.string().max(100).nullable().optional(),
  created_at: z.coerce.date(),
});

export const createContactSchema = z.object({
  contact_user_id: z.uuid(),
  nickname: z.string().max(100).optional(),
});

export const updateContactSchema = z.object({
  nickname: z.string().max(100).optional(),
});

// Types
export type Contact = z.infer<typeof contactSchema>;
export type CreateContactDto = z.infer<typeof createContactSchema>;
export type UpdateContactDto = z.infer<typeof updateContactSchema>;
