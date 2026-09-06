import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { IApiErrorResponse } from '@repo/shared';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { getRequestId } from '@/common/utils/request-id.util';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode: HttpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = this.extract(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          err: exception,
          requestId: request.id,
          method: request.method,
          url: request.url,
        },
        'Unhandled exception',
      );
    }

    const body: IApiErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: getRequestId(request),
    };

    response.status(statusCode).json(body);
  }

  private extract(exception: unknown): {
    message: string;
    errors?: Record<string, string>;
  } {
    if (!(exception instanceof HttpException)) {
      // Never leak internal error details to the client.
      return { message: 'Internal server error' };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { message: payload };
    }

    const { message, errors, error } = payload as {
      message?: string | string[];
      errors?: Record<string, string>;
      error?: Record<string, { status?: string; message?: string }>;
    };

    if (Array.isArray(message)) {
      return {
        message: 'Validation failed',
        errors: Object.fromEntries(message.map((m, i) => [String(i), m])),
      };
    }

    // Terminus reports failing indicators under `error`, keyed by indicator name.
    if (!message && error && Object.keys(error).length > 0) {
      return {
        message: 'Health check failed',
        errors: Object.fromEntries(
          Object.entries(error).map(([key, value]) => [
            key,
            value?.message ?? value?.status ?? 'down',
          ]),
        ),
      };
    }

    return {
      message: message ?? exception.message,
      errors,
    };
  }
}
