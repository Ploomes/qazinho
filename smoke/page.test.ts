import type { Page } from 'playwright-core';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BUILT = join(process.cwd(), 'out', 'renderer');
const PORT = 4322;

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer((request, response) => {
  const asked = (request.url ?? '/').split('?')[0] ?? '/';

  // Chrome asks for a favicon on its own; an Electron window never does.
  if (asked === '/favicon.ico') {
    response.writeHead(204).end();

    return;
  }

  const file = join(BUILT, normalize(asked === '/' ? 'index.html' : asked));

  void stat(file)
    .then(() => {
      response.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      });
      createReadStream(file).pipe(response);
    })
    .catch(() => {
      response.writeHead(404).end();
    });
});

let page: Page;
const said: string[] = [];

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (message) => {
    if (message.type() === 'error') said.push(message.text());
  });
  page.on('pageerror', (reason) => said.push(reason.message));

  await page.goto(`http://127.0.0.1:${String(PORT)}/`);
  await page.waitForTimeout(500);
});

afterAll(async () => {
  await page.context().browser()?.close();
  server.close();
});

describe('the built page, with no bridge behind it', () => {
  it('opens on the welcome screen', async () => {
    expect(await page.locator('.titlebar').count()).toBe(1);
    expect(await page.locator('body').innerText()).toContain('No projects yet.');
  });

  it('takes a project, a target and a workspace', async () => {
    await page.getByRole('button', { name: 'New project' }).first().click();
    await page.getByPlaceholder('Shop · staging').fill('Smoke · staging');
    await page.getByPlaceholder('https://staging.yourshop.com').fill('https://shop.test');
    await page.getByRole('button', { name: 'Create project' }).click();

    await page.getByRole('button', { name: 'New workspace here' }).first().click();
    await page.getByPlaceholder('Checkout regression').fill('Cart');
    await page.getByRole('button', { name: 'Create workspace' }).click();

    expect(await page.locator('body').innerText()).toContain('Cart');
  });

  it('walks every tab of a workspace without falling over', async () => {
    for (const tab of ['Plan', 'Runs', 'Bugs', 'Chat']) {
      await page.locator('.workspace-tabs__tab', { hasText: tab }).first().click();
      await page.waitForTimeout(150);
    }

    expect(await page.locator('body').innerText()).toContain('Cart');
  });

  it('opens the resources popover and the model menu', async () => {
    await page.locator('.titlebar__meter-button').first().click();
    await page.waitForTimeout(200);
    expect(await page.locator('.resource-popover').count()).toBe(1);

    await page.locator('.titlebar__meter-button').last().click();
    await page.waitForTimeout(200);
    expect(await page.locator('.model-popover').count()).toBe(1);
  });

  it('opens Settings, and every tab of it', async () => {
    await page.keyboard.press('Meta+,');
    await page.waitForTimeout(200);

    for (const tab of ['devices', 'integrations', 'appearance', 'shortcuts', 'about']) {
      await page.locator('.settings__nav-item', { hasText: tab }).first().click();
      await page.waitForTimeout(150);
    }

    expect(await page.locator('body').innerText()).toContain('gocrash');
  });

  it('says nothing to the console the whole way through', () => {
    for (const one of said) console.log(`console: ${one}`);

    expect(said).toEqual([]);
  });
});
