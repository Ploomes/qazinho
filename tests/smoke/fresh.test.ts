import { mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebDriver } from '@salve-software/qazinho-harness/engine';

/**
 * Um caso que deixa algo para trás não pode entregá-lo ao próximo: o carrinho da loja, um
 * login, um formulário pela metade. A página abaixo guarda uma visita em cada lugar onde
 * um site pode guardar uma, e diz o que achou quando carrega.
 */
const PAGE = `<!doctype html><html><body>
  <p id="seen"></p>
  <button onclick="localStorage.setItem('cart', '3'); sessionStorage.setItem('step', '2'); document.cookie = 'session=abc; path=/'; indexedDB.open('shop').onupgradeneeded = (e) => e.target.result.createObjectStore('cart')">Keep</button>
  <script>
    indexedDB.databases().then((dbs) => {
      document.getElementById('seen').textContent = [
        'cart=' + (localStorage.getItem('cart') ?? 'none'),
        'step=' + (sessionStorage.getItem('step') ?? 'none'),
        'cookie=' + (document.cookie || 'none'),
        'db=' + (dbs.some((db) => db.name === 'shop') ? 'shop' : 'none'),
      ].join(' ');
    });
  </script>
</body></html>`;

const PORT = 4333;
const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});

async function seen(driver: WebDriver): Promise<string> {
  await driver.act({ kind: 'wait', target: '', value: '400' });

  return /cart=\S+ step=\S+ cookie=\S+ db=\S+/.exec(await driver.describe())?.[0] ?? '';
}

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
});

afterAll(() => {
  site.close();
});

describe('a fresh start between cases', () => {
  it('forgets the cart, the session, the cookie and the database a case left behind', async () => {
    const driver = new WebDriver({
      url: `http://127.0.0.1:${String(PORT)}/`,
      profileDir: await mkdtemp(join(tmpdir(), 'qazinho-fresh-')),
    });

    await driver.open();

    try {
      expect(await seen(driver)).toBe('cart=none step=none cookie=none db=none');

      await driver.act({ kind: 'click', target: 'Keep', value: '' });
      await driver.act({
        kind: 'goto',
        target: `http://127.0.0.1:${String(PORT)}/`,
        value: '',
      });
      expect(await seen(driver)).toBe('cart=3 step=2 cookie=session=abc db=shop');

      await driver.restart();
      expect(await seen(driver)).toBe('cart=none step=none cookie=none db=none');
    } finally {
      await driver.close();
    }
  });

  it('keeps streaming the device after the new tab opens', async () => {
    const frames: Buffer[] = [];
    const driver = new WebDriver({
      url: `http://127.0.0.1:${String(PORT)}/`,
      profileDir: await mkdtemp(join(tmpdir(), 'qazinho-fresh-')),
    });

    await driver.open();

    try {
      await driver.stream((jpeg) => frames.push(jpeg));
      await driver.restart();

      const from = frames.length;

      await driver.act({ kind: 'click', target: 'Keep', value: '' });
      await driver.act({
        kind: 'goto',
        target: `http://127.0.0.1:${String(PORT)}/`,
        value: '',
      });
      expect(frames.length).toBeGreaterThan(from);
    } finally {
      await driver.close();
    }
  });

  it('opens a run on an empty profile, whatever an earlier run left in it', async () => {
    const profileDir = await mkdtemp(join(tmpdir(), 'qazinho-fresh-'));

    await mkdir(join(profileDir, 'Default'), { recursive: true });
    await writeFile(join(profileDir, 'Default', 'left-behind.txt'), 'an earlier run');

    const driver = new WebDriver({
      url: `http://127.0.0.1:${String(PORT)}/`,
      profileDir,
    });

    await driver.open();

    try {
      expect(await readdir(join(profileDir, 'Default'))).not.toContain('left-behind.txt');
      expect(await seen(driver)).toBe('cart=none step=none cookie=none db=none');
    } finally {
      await driver.close();
    }
  });
});
