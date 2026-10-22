import { expect, test } from '@playwright/test';

test.describe('CT-FLK · Flaky', () => {
  test.describe.configure({ retries: 1 });

  test('CT-FLK-001 · Passes on its retry', async ({ page }) => {
    await page.goto('/');
    expect(test.info().retry).toBe(1);
  });
});
