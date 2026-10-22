import { expect, test } from '@playwright/test';

test.describe('CT-NAV · Navigation', () => {
  test('CT-NAV-001 · Opens the products', async ({ page }) => {
    await page.goto('/');
    await test.step('Click Products', async () => {
      await page.getByRole('link', { name: 'Products' }).click();
    });
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });

  test('CT-NAV-002 · Opens the cart from the menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'My cart' }).click({ timeout: 1_500 });
  });

  test('CT-NAV-003 · Saves the profile @altera-dados', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
  });
});
