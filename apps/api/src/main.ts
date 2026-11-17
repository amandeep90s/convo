import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  app.setGlobalPrefix('api/v1');

  const defaultSecurityHeaders = helmet();
  const swaggerSecurityHeaders = helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "'unsafe-eval'"],
      },
    },
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    const isSwaggerUiPage =
      request.path === '/api/v1/docs' || request.path === '/api/v1/docs/';
    const securityHeaders = isSwaggerUiPage
      ? swaggerSecurityHeaders
      : defaultSecurityHeaders;
    securityHeaders(request, response, next);
  });

  app.enableCors({
    origin: configService.getOrThrow<string[]>('app.corsOrigins'),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86_400,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Convo API')
    .setDescription(
      'HTTP API for Convo accounts, messaging, groups, and calls.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(swaggerDocument), {
    useGlobalPrefix: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());

  await app.listen(configService.getOrThrow<number>('app.port'));
}
void bootstrap();
