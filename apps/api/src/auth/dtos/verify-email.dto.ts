import { verifyEmailSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}
