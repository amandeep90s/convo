import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from '@/app.module';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { ZodValidationExceptionFilter } from '@/common/filters/zod-validation-exception.filter';
import { TransformResponseInterceptor } from '@/common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.use(helmet());

  app.enableCors({
    origin: configService.getOrThrow<string>('app.webUrl'),
    credentials: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());
  // Later filters take precedence, so the specific Zod filter is registered last.
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ZodValidationExceptionFilter(),
  );
  app.useGlobalInterceptors(
    new TransformResponseInterceptor(app.get(Reflector)),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
