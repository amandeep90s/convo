import { z } from 'zod';

export const idSchema = z.string().min(1, 'ID is required');

export const dateTimeSchema = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const emailSchema = z
  .email('Please enter a valid email address')
  .trim()
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string({ error: (issue) => (issue.input === undefined ? 'Password is required' : undefined) })
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, {
    message: 'Password must contain at least one special character',
  });

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
