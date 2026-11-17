import type { AuthSession } from '@repo/shared';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  getApiBaseUrl,
  isSameOriginRequest,
  jsonNoStore,
  REFRESH_TOKEN_COOKIE,
  refreshAuthSession,
  setAuthCookies,
} from '@/lib/server/api';

const ALLOWED_RESOURCES = new Set([
  'users',
  'user-settings',
  'user-devices',
  'user-sessions',
  'contacts',
  'blocked-users',
  'conversations',
  'private-conversations',
  'groups',
  'communities',
  'conversation-members',
  'group-invites',
  'messages',
  'message-attachments',
  'message-reactions',
  'message-receipts',
  'pinned-messages',
  'calls',
  'call-participants',
  'realtime',
]);
const MAX_JSON_BODY_BYTES = 1_048_576;
const MAX_MULTIPART_BODY_BYTES = 22 * 1_048_576;

export async function proxyAuthenticatedRequest(request: Request, pathSegments: string[]) {
  const method = request.method.toUpperCase();
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
    return jsonNoStore({ success: false, statusCode: 405, message: 'Method not allowed' }, { status: 405 });
  }
  if (method !== 'GET' && !isSameOriginRequest(request)) {
    return jsonNoStore({ success: false, statusCode: 403, message: 'Cross-origin request rejected' }, { status: 403 });
  }
  if (!isValidPath(pathSegments)) {
    return jsonNoStore({ success: false, statusCode: 404, message: 'API route not found' }, { status: 404 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let body: ArrayBuffer | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    const bodyLimit = contentType.startsWith('multipart/form-data') ? MAX_MULTIPART_BODY_BYTES : MAX_JSON_BODY_BYTES;
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > bodyLimit) {
      return jsonNoStore({ success: false, statusCode: 413, message: 'Request body is too large' }, { status: 413 });
    }
    try {
      body = await request.arrayBuffer();
    } catch {
      return jsonNoStore(
        { success: false, statusCode: 400, message: 'Could not read the request body' },
        { status: 400 },
      );
    }
    if (body.byteLength > bodyLimit) {
      return jsonNoStore({ success: false, statusCode: 413, message: 'Request body is too large' }, { status: 413 });
    }
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  let session: AuthSession | null = null;
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  try {
    if (!accessToken && refreshToken) {
      session = await refreshAuthSession(refreshToken);
      accessToken = session?.accessToken;
    }
    if (!accessToken) return unauthorizedResponse();

    const target = new URL(
      `${getApiBaseUrl()}/${pathSegments.map(encodeURIComponent).join('/')}${new URL(request.url).search}`,
    );
    let upstream = await sendRequest(request, target, accessToken, body);
    if (upstream.status === 401 && refreshToken && !session) {
      session = await refreshAuthSession(refreshToken);
      if (session) {
        accessToken = session.accessToken;
        upstream = await sendRequest(request, target, accessToken, body);
      }
    }

    const headers = new Headers();
    for (const header of ['content-type', 'content-disposition', 'x-request-id']) {
      const value = upstream.headers.get(header);
      if (value) headers.set(header, value);
    }
    headers.set('cache-control', 'private, no-store');

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
    if (session) setAuthCookies(response, session);
    if (upstream.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return jsonNoStore(
      { success: false, statusCode: 503, message: 'Could not contact the API service' },
      { status: 503 },
    );
  }
}

function isValidPath(pathSegments: string[]): boolean {
  const [resource] = pathSegments;
  return (
    resource !== undefined &&
    ALLOWED_RESOURCES.has(resource) &&
    pathSegments.every((segment) => segment !== '.' && segment !== '..' && /^[\w.-]+$/.test(segment))
  );
}

function sendRequest(
  request: Request,
  target: URL,
  accessToken: string,
  body: ArrayBuffer | undefined,
): Promise<Response> {
  const headers = new Headers({
    accept: request.headers.get('accept') ?? 'application/json',
    authorization: `Bearer ${accessToken}`,
  });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  return fetch(target, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });
}

function unauthorizedResponse() {
  const response = jsonNoStore({ success: false, statusCode: 401, message: 'Sign in to continue' }, { status: 401 });
  clearAuthCookies(response);
  return response;
}
