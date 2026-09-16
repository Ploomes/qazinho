import type { ElectronApplication, Page } from 'playwright-core';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: ElectronApplication;
let page: Page;
const said: string[] = [];

/** The resources popover redraws on every sweep, so its X moves until the list settles. */
async function waitUntilStill(selector: string) {
  let before = '';

  for (let look = 0; look < 40; look += 1) {
    const now = JSON.stringify(await page.locator(selector).boundingBox());

    if (now === before && now !== 'null') return;

    before = now;
    await page.waitForTimeout(150);
  }
}

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
    await waitUntilStill('.resource-popover');
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

  it('opens the OS file picker from the android field', async () => {
    // The dialog is modal and blocks the main process, so it is watched, not clicked through.
    const opened = app.evaluate(({ dialog }) => {
      return new Promise<string>((named) => {
        const real = dialog.showOpenDialog.bind(dialog);

        Object.defineProperty(dialog, 'showOpenDialog', {
          value: (...args: unknown[]) => {
            const options = (args.length > 1 ? args[1] : args[0]) as {
              filters?: { extensions?: string[] }[];
            };

            named(options.filters?.[0]?.extensions?.[0] ?? 'none');
            dialog.showOpenDialog = real;

            return Promise.resolve({ canceled: true, filePaths: [] });
          },
          configurable: true,
          writable: true,
        });
      });
    });

    await page.getByRole('button', { name: 'New project' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.file-field').first().click();

    expect(await opened).toBe('apk');
  });

  it('says nothing to the console the whole way through', () => {
    for (const one of said) console.log(`console: ${one}`);

    expect(said).toEqual([]);
  });
});
