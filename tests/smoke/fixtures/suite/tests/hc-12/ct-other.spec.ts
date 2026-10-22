import { expect, test } from '@playwright/test';

test('CT-OTH-001 · Opens the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
});
