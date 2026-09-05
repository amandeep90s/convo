import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.BAD_REQUEST;
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

    response.status(status).json({
      statusCode: status,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
}
