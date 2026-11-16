import { requestLoginOtpSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class RequestLoginOtpDto extends createZodDto(requestLoginOtpSchema) {}
