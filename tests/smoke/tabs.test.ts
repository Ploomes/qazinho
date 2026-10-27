import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebDriver } from '@salve-software/qazinho-harness/engine';

/**
 * A shop whose terms open in a new tab, and a sign-in that opens a window and closes it when it
 * is done, the way an OAuth popup does. The agent kept reading the first tab, as if nothing had
 * opened, and could never read the terms.
 */
const PAGES: Record<string, string> = {
  '/': `<a href="/terms" target="_blank">Terms</a>
    <button onclick="window.open('/popup', 'login')">Sign in with Acme</button>`,
  '/terms': '<h1>Terms of use</h1>',
  '/popup': '<h1>Acme sign-in</h1><button onclick="window.close()">Allow</button>',
};

const PORT = 4344;
const site = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><meta charset="utf-8">${PAGES[request.url ?? '/'] ?? ''}`);
});
let driver: WebDriver;
const url = `http://127.0.0.1:${String(PORT)}/`;

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
  driver = new WebDriver({
    url,
    profileDir: await mkdtemp(join(tmpdir(), 'qazinho-tabs-')),
  });
  await driver.open();
});

afterAll(async () => {
  await driver.close();
  site.close();
});

describe('tabs and windows the app opens', () => {
  it('reads the tab a link opened, the way a person looks at it', async () => {
    await driver.act({ kind: 'click', target: 'Terms', value: '' });

    expect(await driver.describe()).toContain('Terms of use');
  });

  it('goes back to the page that opened a window once the window closes itself', async () => {
    await driver.restart();
    await driver.act({ kind: 'click', target: 'Sign in with Acme', value: '' });

    expect(await driver.describe()).toContain('Acme sign-in');

    await driver.act({ kind: 'click', target: 'Allow', value: '' });
    await driver.act({ kind: 'wait', target: '', value: '500' });

    expect(await driver.describe()).toContain(`URL: ${url}`);
  });
});
