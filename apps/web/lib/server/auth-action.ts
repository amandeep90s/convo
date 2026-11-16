import type { AuthSession } from '@repo/shared';

import {
  type ApiPayload,
  getApiBaseUrl,
  getAuthSession,
  isSameOriginRequest,
  jsonNoStore,
  readApiPayload,
  setAuthCookies,
} from '@/lib/server/api';

export async function forwardAuthAction(request: Request, endpoint: string, establishSession = false) {
  if (!isSameOriginRequest(request)) {
    return jsonNoStore({ success: false, statusCode: 403, message: 'Cross-origin request rejected' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 400, message: 'A valid JSON request is required' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
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

  if (!upstream.ok || !establishSession) {
    return jsonNoStore(payload, { status: upstream.status });
  }

  let session: AuthSession | null;
  try {
    session = getAuthSession(payload);
  } catch {
    session = null;
  }
  if (!session) {
    return jsonNoStore(
      { success: false, statusCode: 502, message: 'The authentication service returned an invalid session' },
      { status: 502 },
    );
  }

  const response = jsonNoStore(
    {
      success: true,
      statusCode: upstream.status,
      message: payload.message ?? 'Signed in',
      data: { user: session.user, expiresAt: session.expiresAt },
    },
    { status: upstream.status },
  );
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

export function authActionNotFound() {
  return jsonNoStore({ success: false, statusCode: 404, message: 'Authentication action not found' }, { status: 404 });
}
