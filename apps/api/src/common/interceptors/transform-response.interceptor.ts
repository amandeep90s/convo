import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IApiSuccessResponse } from '@repo/shared';
import type { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

import { RESPONSE_MESSAGE_KEY } from '@/common/decorators/response-message.decorator';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  IApiSuccessResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Success';

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode: response.statusCode,
        message,
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
