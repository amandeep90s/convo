import { refreshSessionSchema } from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class RefreshSessionDto extends createZodDto(refreshSessionSchema) {}
