import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from '@/app.module';
import { ZodValidationExceptionFilter } from '@/common/filters/zod-validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ZodValidationExceptionFilter());

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
