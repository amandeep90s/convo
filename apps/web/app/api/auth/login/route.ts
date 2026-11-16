import type { AuthSession } from '@repo/shared';

import {
  type ApiPayload,
  getApiBaseUrl,
  getAuthSession,
  jsonNoStore,
  readApiPayload,
  setAuthCookies,
} from '@/lib/server/api';

export async function POST(request: Request) {
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 400, message: 'A valid JSON request is required' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(credentials),
      cache: 'no-store',
    });
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 503, message: 'The authentication service is unavailable' },
      { status: 503 },
    );
  }

  let payload: ApiPayload;
  try {
    payload = await readApiPayload(upstream);
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 502, message: 'The authentication service returned an invalid response' },
      { status: 502 },
    );
  }
  if (!upstream.ok) return jsonNoStore(payload, { status: upstream.status });

  let session: AuthSession;
  try {
    const parsedSession = getAuthSession(payload);
    if (!parsedSession) throw new Error('Login did not return a session');
    session = parsedSession;
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 502, message: 'The authentication service returned an invalid session' },
      { status: 502 },
    );
  }

  const response = jsonNoStore({
    success: true,
    statusCode: upstream.status,
    message: payload.message ?? 'Signed in',
    data: { user: session.user, expiresAt: session.expiresAt },
  });
  try {
    setAuthCookies(response, session);
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 502, message: 'The authentication service returned invalid tokens' },
      { status: 502 },
    );
  }
  return response;
}
