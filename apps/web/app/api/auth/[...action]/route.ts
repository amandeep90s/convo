import { authActionNotFound, forwardAuthAction } from '@/lib/server/auth-action';

const authActions: Record<string, { endpoint: string; establishSession?: boolean }> = {
  register: { endpoint: '/auth/register' },
  'verify-email': { endpoint: '/auth/verify-email' },
  'resend-verification': { endpoint: '/auth/resend-verification' },
  'forgot-password': { endpoint: '/auth/forgot-password' },
  'reset-password': { endpoint: '/auth/reset-password' },
  'login/otp/request': { endpoint: '/auth/login/otp/request' },
  'login/otp/verify': {
    endpoint: '/auth/login/otp/verify',
    establishSession: true,
  },
};

type RouteContext = {
  params: Promise<{ action: string[] }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { action } = await params;
  const target = authActions[action.join('/')];
  if (!target) return authActionNotFound();

  return forwardAuthAction(request, target.endpoint, target.establishSession);
}
