import { expect, test } from '@playwright/test';

test('home page renders the Convo application', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Convo');
  await expect(page.getByRole('heading', { name: 'Convo App' })).toBeVisible();
});

test('message search exposes query and filter controls', async ({ page }) => {
  await page.goto('/search');

  await expect(page.getByRole('heading', { name: 'Search messages' })).toBeVisible();
  await expect(page.getByLabel('Message text')).toBeVisible();
  await expect(page.getByLabel('Sender')).toBeVisible();
  await expect(page.getByLabel('From date')).toBeVisible();
  await expect(page.getByLabel('To date')).toBeVisible();
  await expect(page.getByLabel('Attachment')).toBeVisible();
});

test('message search submits filters and renders matching messages', async ({ page }) => {
  await page.route('**/api/messages/search**', async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('q')).toBe('project update');
    expect(url.searchParams.get('sender')).toBe('Alex');
    expect(url.searchParams.get('from')).toBeTruthy();
    expect(url.searchParams.get('to')).toBeTruthy();
    expect(url.searchParams.get('attachmentType')).toBe('image');

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [
            {
              id: 'm1',
              conversation_id: 'c1',
              type: 'text',
              content: 'Project update is ready',
              created_at: '2026-11-16T10:00:00.000Z',
              sender: { id: 'u1', username: 'alex', name: 'Alex', avatar_url: null },
              conversation: { id: 'c1', name: 'Team chat', type: 'group' },
              attachments: [],
            },
          ],
          page: 1,
          total: 1,
          totalPages: 1,
        },
      }),
    });
  });

  await page.goto('/search');
  await page.getByLabel('Message text').fill('project update');
  await page.getByLabel('Sender').fill('Alex');
  await page.getByLabel('From date').fill('2026-11-01');
  await page.getByLabel('To date').fill('2026-11-16');
  await page.getByLabel('Attachment').selectOption('image');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByText('Project update is ready')).toBeVisible();
  await expect(page.getByText('Team chat', { exact: false })).toBeVisible();
  await expect(page.getByText('1 result')).toBeVisible();
});
