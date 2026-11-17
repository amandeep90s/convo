import { NextResponse } from 'next/server';

import { getApiBaseUrl, jsonNoStore, readApiPayload } from '@/lib/server/api';
import { proxyAuthenticatedRequest } from '@/lib/server/api-proxy';

export async function POST(request: Request) {
  const response = await proxyAuthenticatedRequest(request, ['realtime', 'session']);
  if (!response.ok) return response;

  const payload = await readApiPayload(response);
  if (
    payload.success !== true ||
    typeof payload.data !== 'object' ||
    payload.data === null ||
    !('token' in payload.data) ||
    typeof payload.data.token !== 'string'
  ) {
    return jsonNoStore(
      { success: false, statusCode: 502, message: 'The API returned an invalid realtime session' },
      { status: 502 },
    );
  }
  return NextResponse.json(
    {
      ...payload,
      data: {
        token: payload.data.token,
        url: process.env.REALTIME_URL || new URL(getApiBaseUrl()).origin,
      },
    },
    { status: response.status, headers: response.headers },
  );
}
