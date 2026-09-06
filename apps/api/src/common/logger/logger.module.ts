import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { IncomingMessage, ServerResponse } from 'http';
import { LoggerModule } from 'nestjs-pino';

const REQUEST_ID_HEADER = 'x-request-id';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.getOrThrow<string>('app.environment') === 'production';

        return {
          pinoHttp: {
            level: configService.getOrThrow<string>('app.logLevel'),
            genReqId: (req: IncomingMessage, res: ServerResponse) => {
              const incoming = req.headers[REQUEST_ID_HEADER];
              const requestId =
                (Array.isArray(incoming) ? incoming[0] : incoming) ??
                randomUUID();

              res.setHeader(REQUEST_ID_HEADER, requestId);
              return requestId;
            },
            customProps: (req: IncomingMessage) => ({ requestId: req.id }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                '*.password',
                '*.token',
                '*.accessToken',
                '*.refreshToken',
              ],
              censor: '[redacted]',
            },
            serializers: {
              req: (req: IncomingMessage & { id: string; url: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
            },
            autoLogging: {
              ignore: (req: IncomingMessage) =>
                req.url?.startsWith('/api/v1/health') ?? false,
            },
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname',
                  },
                },
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}
