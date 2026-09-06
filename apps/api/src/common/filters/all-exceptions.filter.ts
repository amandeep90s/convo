import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { IApiErrorResponse } from '@repo/shared';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

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
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: IApiErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
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

    const { message, errors } = payload as {
      message?: string | string[];
      errors?: Record<string, string>;
    };

    if (Array.isArray(message)) {
      return {
        message: 'Validation failed',
        errors: Object.fromEntries(message.map((m, i) => [String(i), m])),
      };
    }

    return {
      message: message ?? exception.message,
      errors,
    };
  }
}
