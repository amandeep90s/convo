import type { AuthSession } from '@repo/shared';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  type ApiPayload,
  clearAuthCookies,
  getApiBaseUrl,
  jsonNoStore,
  readApiPayload,
  REFRESH_TOKEN_COOKIE,
  refreshAuthSession,
  setAuthCookies,
} from '@/lib/server/api';

const SEARCH_PARAMS = ['q', 'conversationId', 'sender', 'from', 'to', 'attachmentType', 'page', 'limit'] as const;

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const searchParams = new URLSearchParams();
  for (const key of SEARCH_PARAMS) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) searchParams.set(key, value);
  }

  let session: AuthSession | null = null;
  let token = accessToken;
  try {
    if (!token && refreshToken) {
      session = await refreshAuthSession(refreshToken);
      token = session?.accessToken;
    }
    if (!token) {
      const response = jsonNoStore(
        { success: false, statusCode: 401, message: 'Sign in to search your messages' },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    let upstream = await runSearch(searchParams, token);
    if (upstream.status === 401 && refreshToken && !session) {
      session = await refreshAuthSession(refreshToken);
      if (session) {
        token = session.accessToken;
        upstream = await runSearch(searchParams, token);
      }
    }

    let payload: ApiPayload;
    try {
      payload = await readApiPayload(upstream);
    } catch {
      return jsonNoStore(
        { success: false, statusCode: 502, message: 'The API returned an invalid search response' },
        { status: 502 },
      );
    }
    const response = jsonNoStore(payload, { status: upstream.status });
    if (session) setAuthCookies(response, session);
    if (upstream.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 503, message: 'Could not contact the search service' },
      { status: 503 },
    );
  }
}

function runSearch(params: URLSearchParams, accessToken: string): Promise<Response> {
  return fetch(`${getApiBaseUrl()}/messages/search?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
}
