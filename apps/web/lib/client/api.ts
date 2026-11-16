export type ApiEnvelope<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiRequestInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
};

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  let body = init.body;

  if (isPlainObject(body)) {
    body = JSON.stringify(body);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  }

  const response = await fetch(`/api/backend/${path.replace(/^\/+/, '')}`, {
    ...init,
    body: body as BodyInit | null | undefined,
    headers,
    cache: 'no-store',
    credentials: 'same-origin',
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new ApiError('The API request failed', response.status);
    return undefined as T;
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('success' in payload) ||
    !('message' in payload) ||
    typeof payload.message !== 'string'
  ) {
    throw new ApiError('The API returned an invalid response', 502);
  }
  if (!response.ok || payload.success !== true) {
    throw new ApiError(payload.message, response.status);
  }
  if (!('data' in payload)) throw new ApiError('The API response is missing data', 502);
  return payload.data as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
