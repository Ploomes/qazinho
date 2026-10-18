import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebDriver } from '@/main/classes/devices/WebDriver';

/**
 * A sign-in page, like the shop's: an "Entrar" link in the menu and an "Entrar" button in the
 * form, with the page's heading saying "Entrar" too. The agent called the button "Entrar #2",
 * and the click used to land on the heading.
 */
const PAGE = `<!doctype html><html><body>
  <header><a href="#menu">Entrar</a></header>
  <h1>Entrar</h1>
  <form onsubmit="event.preventDefault(); document.getElementById('out').textContent = 'Form sent'">
    <input aria-label="E-mail"><button>Entrar</button>
  </form>
  <p id="out">Nothing sent</p>
</body></html>`;

const PORT = 4339;
const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});
let driver: WebDriver;

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
  driver = new WebDriver({
    url: `http://127.0.0.1:${String(PORT)}/`,
    profileDir: await mkdtemp(join(tmpdir(), 'qazinho-locate-')),
  });
  await driver.open();
});

afterAll(async () => {
  await driver.close();
  site.close();
});

describe('controls that read alike in different roles', () => {
  it('are numbered in the order the page shows them', async () => {
    const screen = await driver.describe();

    expect(screen).toContain('a: Entrar #1');
    expect(screen).toContain('button: Entrar #2');
  });

  it('"#2" clicks the second one look listed, the form button', async () => {
    await driver.act({ kind: 'click', target: 'Entrar #2', value: '' });

    expect(await driver.describe()).toContain('Form sent');
  });

  it('"#1" clicks the first one look listed, the menu link', async () => {
    await driver.act({ kind: 'click', target: 'Entrar #1', value: '' });

    expect(await driver.describe()).toContain('URL: http://127.0.0.1:4339/#menu');
  });
});
