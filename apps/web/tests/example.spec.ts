import { expect, test } from '@playwright/test';

test('home page renders the Convo application', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Convo');
  await expect(page.getByRole('heading', { name: 'Convo App' })).toBeVisible();
});
