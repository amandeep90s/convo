import type { Request } from 'express';

/** `req.id` is typed loosely by pino-http; normalise it to a string. */
export function getRequestId(request: Request): string {
  const id: unknown = request.id;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
}
