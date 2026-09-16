import type { ElectronApplication, Page } from 'playwright-core';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: ElectronApplication;
let page: Page;
const said: string[] = [];

beforeAll(async () => {
  app = await electron.launch({
    args: [
      join(process.cwd(), 'out', 'main', 'index.js'),
      // Electron: its own data directory, so a run here never touches the QA's real projects.
      `--user-data-dir=${await mkdtemp(join(tmpdir(), 'gocrash-e2e-'))}`,
    ],
  });

  page = await app.firstWindow();

  page.on('console', (message) => {
    if (message.type() === 'error') said.push(message.text());
  });
  page.on('pageerror', (reason) => said.push(reason.message));

  await page.waitForSelector('.titlebar');
}, 120_000);

afterAll(async () => {
  await app.close();
});

describe('the real window', () => {
  it('opens, and the bridge answers', async () => {
    expect(await page.locator('.titlebar').count()).toBe(1);
    const bridge = await page.evaluate(() => {
      // The callback runs in the page, where `window` is not in this project's lib.
      const web = globalThis as unknown as { gocrash?: unknown };

      return typeof web.gocrash;
    });

    expect(bridge).toBe('object');
  });

  it('closes the resources popover from its own X', async () => {
    await page.locator('.titlebar__meter-button').first().click();
    await page.waitForTimeout(300);
    expect(await page.locator('.resource-popover').count()).toBe(1);

    await page.locator('.resource-popover .icon-button').click();
    await page.waitForTimeout(400);

    expect(await page.locator('.resource-popover').count()).toBe(0);
  });

  it('picks another model, and the titlebar says so', async () => {
    await page.locator('.titlebar__meter-button').last().click();
    await page.waitForTimeout(300);
    expect(await page.locator('.model-popover').count()).toBe(1);

    await page.locator('.model-popover__row', { hasText: 'Opus' }).click();
    await page.waitForTimeout(300);

    expect(await page.locator('.titlebar').innerText()).toContain('opus');
  });

  it('says nothing to the console the whole way through', () => {
    for (const one of said) console.log(`console: ${one}`);

    expect(said).toEqual([]);
  });
});
