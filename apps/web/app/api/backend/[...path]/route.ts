import { proxyAuthenticatedRequest } from '@/lib/server/api-proxy';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function handle(request: Request, context: RouteContext) {
  return context.params.then(({ path }) => proxyAuthenticatedRequest(request, path));
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
