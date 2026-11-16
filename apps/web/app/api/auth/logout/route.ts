import { cookies } from 'next/headers';

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  getApiBaseUrl,
  jsonNoStore,
  readApiPayload,
  REFRESH_TOKEN_COOKIE,
  refreshAuthSession,
} from '@/lib/server/api';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  let token = accessToken;

  try {
    if (token) {
      let upstream = await revokeSession(token);
      if (upstream.status === 401 && refreshToken) {
        const session = await refreshAuthSession(refreshToken);
        if (session) {
          token = session.accessToken;
          upstream = await revokeSession(token);
        }
      }

      if (!upstream.ok && upstream.status !== 401) {
        const payload = await readApiPayload(upstream);
        const response = jsonNoStore(payload, { status: upstream.status });
        clearAuthCookies(response);
        return response;
      }
    } else if (refreshToken) {
      const session = await refreshAuthSession(refreshToken);
      if (session) {
        const upstream = await revokeSession(session.accessToken);
        if (!upstream.ok && upstream.status !== 401) {
          const payload = await readApiPayload(upstream);
          const response = jsonNoStore(payload, { status: upstream.status });
          clearAuthCookies(response);
          return response;
        }
      }
    }
  } catch {
    const response = jsonNoStore(
      { success: false, statusCode: 503, message: 'Could not contact the authentication service' },
      { status: 503 },
    );
    clearAuthCookies(response);
    return response;
  }

  const response = jsonNoStore({
    success: true,
    statusCode: 200,
    message: 'Signed out',
    data: { loggedOut: true },
  });
  clearAuthCookies(response);
  return response;
}

function revokeSession(accessToken: string): Promise<Response> {
  return fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
}
