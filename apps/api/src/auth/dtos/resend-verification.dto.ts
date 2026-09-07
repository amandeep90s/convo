import { resendVerificationSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class ResendVerificationDto extends createZodDto(
  resendVerificationSchema,
) {}
