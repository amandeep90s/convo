import { expect, test } from '@playwright/test';

test('API responds on the root route', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toHaveText('Hello World!');
});
