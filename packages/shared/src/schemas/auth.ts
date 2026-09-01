import { z } from 'zod';

import { AUTH_PROVIDERS, USER_ROLES, USER_STATUSES } from '../constants/auth.js';
import { emailSchema, passwordSchema } from './common.js';

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const authProviderSchema = z.enum(AUTH_PROVIDERS);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
  email: emailSchema,
  password: passwordSchema,
});

export const userSummarySchema = z.object({
  id: z.string().min(1),
  email: emailSchema,
  name: z.string().min(1),
  role: userRoleSchema,
  status: userStatusSchema,
  avatarUrl: z.string().nullable().optional(),
});

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }).or(z.string()),
  user: userSummarySchema,
});
