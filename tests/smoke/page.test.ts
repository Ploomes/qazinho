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

/** Both popovers hang off one toggle each, so a test that wants one open says so itself. */
async function openModelMenu() {
  if ((await page.locator('.model-popover').count()) === 0)
    await page.locator('.titlebar__meter-button').last().click();

  await page.waitForTimeout(200);
}

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
  it('opens on the first-run setup, and walks it without a bridge', async () => {
    expect(await page.locator('.titlebar').count()).toBe(1);
    expect(await page.locator('.speech-bubble').innerText()).toContain("I'm the Intern");
    // Electron swallows a click in the drag strip, and Skip setup sits inside it.
    expect(
      await page.locator('.onboarding__skip').evaluate((skip: object) => {
        // The callback runs in the page, where DOM types are not in this project's lib.
        const web = globalThis as unknown as {
          getComputedStyle: (one: object) => {
            getPropertyValue: (name: string) => string;
          };
        };

        return web.getComputedStyle(skip).getPropertyValue('-webkit-app-region');
      }),
    ).toBe('no-drag');

    for (const name of [
      'Let’s start',
      'Continue without an agent',
      'Continue',
      'Skip for now',
    ])
      await page.getByRole('button', { name, exact: true }).click();

    await page.getByRole('button', { name: 'Open QAzinho' }).click();
  });

  it('lands on the welcome screen once the setup is done', async () => {
    expect(await page.locator('body').innerText()).toContain('No projects yet.');
  });

  it('takes a project, a target and a workspace', async () => {
    await page.getByRole('button', { name: 'New project' }).first().click();
    await page.getByPlaceholder('Shop · staging').fill('Smoke · staging');
    await page.getByPlaceholder('https://staging.yourshop.com').fill('https://shop.test');
    await page.getByRole('button', { name: 'Create project' }).click();

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

  it('writes a plan by hand, with no agent anywhere near it', async () => {
    await page.locator('.workspace-tabs__tab', { hasText: 'Plan' }).first().click();
    await page.getByRole('button', { name: 'Add a case' }).first().click();

    await page
      .locator('.plan-case__head .editable-text')
      .first()
      .fill('Cart keeps its items');
    await page.locator('.plan-case__open').first().click();
    await page.getByPlaceholder('what the agent does').first().fill('Add a hat');
    await page.getByPlaceholder('what you expect to see').first().fill('Cart reads 1');
    await page.getByRole('button', { name: 'Add a step' }).first().click();
    await page.waitForTimeout(150);

    expect(await page.locator('.plan-case__step-number').count()).toBe(2);
    expect(await page.locator('body').innerText()).toContain('1 cases · 2 steps');
  });

  it('opens the resources popover and the model menu, and closes them again', async () => {
    await page.locator('.titlebar__meter-button').first().click();
    await page.waitForTimeout(200);
    expect(await page.locator('.resource-popover').count()).toBe(1);

    await page.locator('.resource-popover .icon-button').click();
    await page.waitForTimeout(300);
    expect(await page.locator('.resource-popover').count()).toBe(0);

    await openModelMenu();
    expect(await page.locator('.model-popover').count()).toBe(1);
  });

  it('closes both popovers on a press outside them, and on Escape', async () => {
    await openModelMenu();
    await page.locator('.workspace-tabs__tab', { hasText: 'Plan' }).first().click();
    await page.waitForTimeout(300);
    expect(await page.locator('.model-popover').count()).toBe(0);

    await page.locator('.titlebar__meter-button').first().click();
    await page.waitForTimeout(200);
    await page.locator('body').click({ position: { x: 700, y: 600 } });
    await page.waitForTimeout(300);
    expect(await page.locator('.resource-popover').count()).toBe(0);

    await openModelMenu();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await page.locator('.model-popover').count()).toBe(0);
  });

  it('picks another model, and the titlebar says so', async () => {
    await openModelMenu();

    await page.locator('.model-popover__row', { hasText: /^Opus/ }).click();
    await page.waitForTimeout(200);

    expect(await page.locator('.titlebar').innerText()).toContain('· Opus');
  });

  // Electron swallows a click in a drag region; plain Chrome does not, so only this can catch it.
  it('nothing clickable in the titlebar sits in the window drag region', async () => {
    const dragging = async () =>
      page.evaluate(() => {
        // The callback runs in the page, where DOM types are not in this project's lib.
        const web = globalThis as unknown as {
          document: {
            querySelectorAll: (
              query: string,
            ) => Iterable<{ className: string; tagName: string }>;
          };
          getComputedStyle: (one: object) => {
            getPropertyValue: (name: string) => string;
          };
        };

        return [
          ...web.document.querySelectorAll(
            '.titlebar button, .titlebar a, .titlebar input',
          ),
        ]
          .filter(
            (one) =>
              web.getComputedStyle(one).getPropertyValue('-webkit-app-region') === 'drag',
          )
          .map((one) => one.className || one.tagName);
      });

    await page.locator('.titlebar__meter-button').first().click();
    await page.waitForTimeout(200);
    expect(await page.locator('.resource-popover').count()).toBe(1);
    expect(await dragging()).toEqual([]);

    await openModelMenu();
    expect(await page.locator('.model-popover').count()).toBe(1);
    expect(await dragging()).toEqual([]);
  });

  it('opens Settings, and every tab of it', async () => {
    await page.keyboard.press('Meta+,');
    await page.waitForTimeout(200);

    for (const tab of ['devices', 'integrations', 'appearance', 'shortcuts', 'about']) {
      await page.locator('.settings__nav-item', { hasText: tab }).first().click();
      await page.waitForTimeout(150);
    }

    expect(await page.locator('body').innerText()).toContain('QAzinho');
  });

  it('says nothing to the console the whole way through', () => {
    for (const one of said) console.log(`console: ${one}`);

    expect(said).toEqual([]);
  });
});
