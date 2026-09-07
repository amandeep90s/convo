import { z } from 'zod';

import { emailSchema, passwordSchema } from './common.js';
import { USER_ACCOUNT_STATUSES } from '../constants/user.js';

export const userAccountStatusSchema = z.enum(USER_ACCOUNT_STATUSES);

export const userSchema = z.object({
  id: z.uuid(),
  phone: z.string().max(20).nullable().optional(),
  email: emailSchema,
  username: z.string().trim().min(3).max(50),
  name: z.string().trim().min(1).max(100),
  about: z.string().max(1000).nullable().optional(),
  avatar_url: z.url().nullable().optional(),
  password_hash: z.string().nullable().optional(),
  status: userAccountStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  deleted_at: z.coerce.date().nullable().optional(),
});

export const createUserSchema = z.object({
  phone: z.string().max(20).optional(),
  email: emailSchema,
  username: z.string().trim().min(3).max(50),
  name: z.string().trim().min(1).max(100),
  about: z.string().max(1000).optional(),
  avatar_url: z.url().optional(),
  password: passwordSchema,
});

export const updateUserSchema = createUserSchema.omit({ email: true, password: true }).partial();

// Types
export type UserAccountStatus = z.infer<typeof userAccountStatusSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
