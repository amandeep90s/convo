import { type AuthSession, authSessionSchema } from '@repo/shared';
import { NextResponse } from 'next/server';

export const ACCESS_TOKEN_COOKIE = 'convo_access_token';
export const REFRESH_TOKEN_COOKIE = 'convo_refresh_token';

export type ApiPayload = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

export function getApiBaseUrl(): string {
  return (process.env.API_BASE_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
}

export function jsonNoStore(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set('cache-control', 'private, no-store');
  return response;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readApiPayload(response: Response): Promise<ApiPayload> {
  const body: unknown = await response.json();
  if (!isRecord(body)) throw new Error('The API returned an invalid response');
  return body;
}

export function getAuthSession(payload: ApiPayload): AuthSession | null {
  if (payload.success !== true) return null;
  const parsed = authSessionSchema.safeParse(payload.data);
  if (!parsed.success) throw new Error('The API returned an invalid session');
  return parsed.data;
}

export async function refreshAuthSession(refreshToken: string): Promise<AuthSession | null> {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('The authentication service is unavailable');
  const payload = await readApiPayload(response);
  return getAuthSession(payload);
}

export function setAuthCookies(response: NextResponse, session: AuthSession): void {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...options,
    maxAge: tokenMaxAge(session.accessToken),
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...options,
    maxAge: tokenMaxAge(session.refreshToken),
  });
}

export function clearAuthCookies(response: NextResponse): void {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', options);
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', options);
}

function tokenMaxAge(token: string): number {
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) throw new Error('The API returned an invalid token');
  const claims: unknown = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8'));
  if (!isRecord(claims) || typeof claims.exp !== 'number') {
    throw new Error('The API returned a token without an expiration');
  }
  return Math.max(0, Math.floor(claims.exp - Date.now() / 1000));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
