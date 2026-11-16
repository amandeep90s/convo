import { verifyLoginOtpSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class VerifyLoginOtpDto extends createZodDto(verifyLoginOtpSchema) {}
