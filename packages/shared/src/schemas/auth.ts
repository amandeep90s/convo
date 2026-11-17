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
  identifier: z.string().trim().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

export const requestLoginOtpSchema = loginSchema;

export const loginChallengeSchema = z.object({
  challengeToken: z.string().min(1),
  email: emailSchema,
});

export const verifyLoginOtpSchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Code must contain exactly 6 digits'),
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

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

// Types
export type LoginDto = z.infer<typeof loginSchema>;
export type LoginChallenge = z.infer<typeof loginChallengeSchema>;
export type RequestLoginOtpDto = z.infer<typeof requestLoginOtpSchema>;
export type VerifyLoginOtpDto = z.infer<typeof verifyLoginOtpSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type UserSummary = z.infer<typeof userSummarySchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
export type RefreshSessionDto = z.infer<typeof refreshSessionSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
