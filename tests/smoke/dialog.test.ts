import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebDriver } from '@/main/classes/devices/WebDriver';

/**
 * "Delete" asks first, with the browser's own confirm, and "Save" says so with an alert. Chrome
 * driven by Playwright closed both in silence, as Cancel: the item was never deleted, and the agent
 * never knew a dialog had been there.
 */
const PAGE = `<!doctype html><html><body>
  <button onclick="document.getElementById('out').textContent = confirm('Delete the item?') ? 'Deleted' : 'Kept'">Delete</button>
  <button onclick="alert('Saved!'); document.getElementById('out').textContent = 'After the alert'">Save</button>
  <p id="out">Nothing yet</p>
</body></html>`;

const PORT = 4342;
const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});
let driver: WebDriver;

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
  driver = new WebDriver({
    url: `http://127.0.0.1:${String(PORT)}/`,
    profileDir: await mkdtemp(join(tmpdir(), 'qazinho-dialog-')),
  });
  await driver.open();
});

afterAll(async () => {
  await driver.close();
  site.close();
});

describe('a dialog the page opens', () => {
  it('is answered OK, the way a person goes on, and look says what it asked', async () => {
    await driver.act({ kind: 'click', target: 'Delete', value: '' });

    const screen = await driver.describe();

    expect(screen).toContain('Deleted');
    expect(screen).toContain('DIALOGS (answered OK):\nconfirm: Delete the item?');
  });

  it('tells each dialog once, and an alert by what it said', async () => {
    expect(await driver.describe()).not.toContain('DIALOGS');

    await driver.act({ kind: 'click', target: 'Save', value: '' });

    const screen = await driver.describe();

    expect(screen).toContain('After the alert');
    expect(screen).toContain('alert: Saved!');
  });
});
