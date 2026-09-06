import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { getRequestId } from '@/common/utils/request-id.util';

/** Correlation id assigned by the pino-http `genReqId` hook. */
export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    getRequestId(ctx.switchToHttp().getRequest<Request>()),
);
