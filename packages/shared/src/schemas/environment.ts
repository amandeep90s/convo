import { z } from 'zod';

export const environmentSchema = z.object({
  API_VERSION: z.string().default('v1'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60_000),
  RESEND_API_KEY: z.string(),
  MAIL_FROM: z.string().default('Convo <no-reply@example.com>'),
  WEB_URL: z.url().default('http://localhost:3000'),
  JWT_SECRET: z.string(),
  JWT_TOKEN_AUDIENCE: z.string(),
  JWT_TOKEN_ISSUER: z.string(),
  JWT_ACCESS_TOKEN_TTL: z.string(),
  JWT_REFRESH_TOKEN_TTL: z.string(),
  EMAIL_VERIFICATION_TOKEN_TTL: z.coerce.number().int().positive(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive(),
});

// Types
export type Environment = z.infer<typeof environmentSchema>;
