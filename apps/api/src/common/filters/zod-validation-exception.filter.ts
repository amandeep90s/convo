import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { IApiErrorResponse } from '@repo/shared';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const statusCode = HttpStatus.BAD_REQUEST;
    const zodError = exception.getZodError();

    let formattedErrors: Record<string, string> = {};

    if (zodError instanceof ZodError) {
      formattedErrors = zodError.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const field = issue.path.join('.');
          if (!acc[field]) {
            acc[field] = issue.message;
          }
          return acc;
        },
        {},
      );
    }

    const body: IApiErrorResponse = {
      success: false,
      statusCode,
      message: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }
}
