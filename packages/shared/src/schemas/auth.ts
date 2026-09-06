import { z } from 'zod';

import { AUTH_PROVIDERS, USER_ROLES, USER_STATUSES } from '../constants/auth.js';
import { emailSchema, passwordSchema } from './common.js';

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const authProviderSchema = z.enum(AUTH_PROVIDERS);

export const authUserRoleSchema = userRoleSchema;
export const authUserStatusSchema = userStatusSchema;
export const authProviderTypeSchema = authProviderSchema;

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
    username: z
      .string()
      .trim()
      .min(2, 'Username must be at least 2 characters long')
      .transform((username) => username.toLowerCase()),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Confirm Password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
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
  expiresAt: z.iso.datetime({ offset: true }).or(z.string()),
  user: userSummarySchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// Types
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type UserSummary = z.infer<typeof userSummarySchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
