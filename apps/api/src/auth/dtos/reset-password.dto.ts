import { resetPasswordSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
