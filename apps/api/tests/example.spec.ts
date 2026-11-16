import { expect, test } from '@playwright/test';

test('API responds on the health check route', async ({ request }) => {
  const response = await request.get('/api/v1/health');

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.data.status).toBe('ok');
});

test('protected API routes require a bearer access token', async ({
  request,
}) => {
  const response = await request.get('/api/v1/users/me');

  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.success).toBe(false);
});
