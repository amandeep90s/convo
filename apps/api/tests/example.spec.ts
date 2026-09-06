import { expect, test } from '@playwright/test';

test('API responds on the health check route', async ({ request }) => {
  const response = await request.get('/api/v1/health');

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.data.status).toBe('ok');
});
