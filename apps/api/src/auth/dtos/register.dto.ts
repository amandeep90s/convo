import { registerSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class RegisterUserDto extends createZodDto(registerSchema) {}
