import { expect, test } from '@playwright/test';

test('CT-SEC-001 · Reads the shop key', () => {
  expect(process.env.SHOP_KEY).toBe('the-key-the-team-expects');
});
