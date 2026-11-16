import { forwardAuthAction } from '@/lib/server/auth-action';

export function POST(request: Request) {
  return forwardAuthAction(request, '/auth/login', true);
}
