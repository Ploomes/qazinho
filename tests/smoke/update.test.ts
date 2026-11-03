import type { Server } from 'node:http';
import type { ElectronApplication, Page } from 'playwright-core';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * O app construído contra um feed de atualização e uma API fakes. O feed anuncia uma versão
 * nova e entrega um arquivo aos poucos, para o download ser visto. A API responde 426 a toda
 * chamada, que é o que um servidor faz com um desktop abaixo da versão mínima.
 *
 * O último passo de instalar não roda aqui: o Squirrel do Mac só aceita um app assinado, e
 * este é o Electron rodando de out/. Ele falha ali, e o app precisa ficar de pé mesmo assim.
 */
const VERSION = '99.0.0';
const CHUNKS = 40;
const ARTIFACT = randomBytes(CHUNKS * 64 * 1024);
const FEED_FILE = {
  darwin: 'latest-mac.yml',
  win32: 'latest.yml',
  linux: 'latest-linux.yml',
}[process.platform as 'darwin' | 'win32' | 'linux'];
const ARTIFACT_NAME = {
  darwin: `QAzinho-${VERSION}-${process.arch}-mac.zip`,
  win32: `QAzinho-Setup-${VERSION}.exe`,
  linux: `QAzinho-${VERSION}.AppImage`,
}[process.platform as 'darwin' | 'win32' | 'linux'];

const DEV_CONFIG = join(process.cwd(), 'out', 'main', 'dev-app-update.yml');

const CACHE = join(
  {
    darwin: join(homedir(), 'Library', 'Caches'),
    win32: process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'),
    linux: join(homedir(), '.cache'),
  }[process.platform as 'darwin' | 'win32' | 'linux'],
  'qazinho-updater-smoke',
);

let app: ElectronApplication;
let page: Page;
let feed: Server;
let api: Server;

const later = (ms: number) => new Promise((wake) => setTimeout(wake, ms));

const portOf = (server: Server) => {
  const address = server.address();

  return address !== null && typeof address === 'object' ? address.port : 0;
};

const manifest = () => {
  const sha512 = createHash('sha512').update(ARTIFACT).digest('base64');

  return [
    `version: ${VERSION}`,
    'files:',
    `  - url: ${ARTIFACT_NAME}`,
    `    sha512: ${sha512}`,
    `    size: ${String(ARTIFACT.length)}`,
    `path: ${ARTIFACT_NAME}`,
    `sha512: ${sha512}`,
    `releaseDate: '2026-11-03T12:00:00.000Z'`,
    '',
  ].join('\n');
};

beforeAll(async () => {
  feed = createServer((request, response) => {
    if (request.url?.includes(FEED_FILE) === true) {
      response.setHeader('content-type', 'text/yaml');
      response.end(manifest());

      return;
    }

    response.setHeader('content-length', String(ARTIFACT.length));

    void (async () => {
      for (let chunk = 0; chunk < CHUNKS; chunk += 1) {
        response.write(ARTIFACT.subarray(chunk * 64 * 1024, (chunk + 1) * 64 * 1024));
        await later(50);
      }

      response.end();
    })();
  });
  api = createServer((_request, response) => {
    response.statusCode = 426;
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({ error: 'update_required', details: { minVersion: VERSION } }),
    );
  });
  await new Promise<void>((ready) => feed.listen(0, '127.0.0.1', ready));
  await new Promise<void>((ready) => api.listen(0, '127.0.0.1', ready));

  const dataDir = await mkdtemp(join(tmpdir(), 'qazinho-update-'));

  // O electron-updater lê a pasta de cache deste arquivo, que um app instalado traz nos recursos.
  await writeFile(
    DEV_CONFIG,
    'provider: generic\nurl: http://127.0.0.1\nupdaterCacheDirName: qazinho-updater-smoke\n',
  );

  app = await electron.launch({
    args: [join(process.cwd(), 'out', 'main', 'index.js'), `--user-data-dir=${dataDir}`],
    env: {
      ...process.env,
      QAZINHO_UPDATE_FEED: `http://127.0.0.1:${String(portOf(feed))}`,
      QAZINHO_API_URL: `http://127.0.0.1:${String(portOf(api))}`,
    },
  });
  page = await app.firstWindow();
  await page.waitForSelector('.titlebar');
  await page.evaluate(() => {
    const web = globalThis as unknown as {
      localStorage: { setItem: (key: string, value: string) => void };
    };

    web.localStorage.setItem(
      'qazinho.settings',
      JSON.stringify({
        state: { agent: 'Claude Code', language: 'pt', hasOnboarded: true },
        version: 1,
      }),
    );
  });
  await page.reload();
  await page.waitForSelector('.titlebar__meters');
}, 60_000);

afterAll(async () => {
  await app?.close();
  await rm(DEV_CONFIG, { force: true });
  await rm(CACHE, { recursive: true, force: true });
  feed?.closeAllConnections();
  feed?.close();
  api?.closeAllConnections();
  api?.close();
});

const tell = (update: Record<string, unknown>) =>
  app.evaluate(({ BrowserWindow }, event) => {
    for (const open of BrowserWindow.getAllWindows())
      open.webContents.send('update:event', event);
  }, update);

const stateOf = () =>
  page.evaluate(
    () =>
      (
        globalThis as unknown as {
          qazinho: { appUpdate: () => Promise<{ phase: string; isRequired: boolean }> };
        }
      ).qazinho.appUpdate() as Promise<{
        phase: string;
        version?: string;
        percent?: number;
        isRequired: boolean;
      }>,
  );

describe('updating the app', () => {
  it('finds the new version on its own and downloads it, with no one asking', async () => {
    let seen: Awaited<ReturnType<typeof stateOf>> = { phase: 'idle', isRequired: false };

    for (let tries = 0; tries < 60 && seen.phase !== 'downloading'; tries += 1) {
      seen = await stateOf();
      await later(250);
    }

    expect(seen).toMatchObject({
      phase: 'downloading',
      version: VERSION,
      isRequired: false,
    });
  });

  it('keeps the app standing whatever the download ends in', async () => {
    let seen = await stateOf();

    for (let tries = 0; tries < 60 && seen.phase === 'downloading'; tries += 1) {
      await later(250);
      seen = await stateOf();
    }

    expect(['idle', 'ready']).toContain(seen.phase);
    expect(await page.locator('.titlebar__meters').count()).toBe(1);
  });

  it('shows the button once the main says a version is ready, outside the drag region', async () => {
    await tell({ phase: 'ready', version: VERSION, isRequired: false });

    const button = page.locator('.update-button__action');

    await button.waitFor();

    expect(await button.innerText()).toContain('Atualizar');
    expect(
      await button.evaluate(
        (node) =>
          (
            globalThis as unknown as {
              getComputedStyle: (one: unknown) => Record<string, string>;
            }
          ).getComputedStyle(node).webkitAppRegion,
      ),
    ).toBe('no-drag');

    await page.screenshot({ path: join(tmpdir(), 'qazinho-update-button.png') });
  });

  it('takes over the window when the API refuses this version, and offers a way out', async () => {
    await page.evaluate(() =>
      (
        globalThis as unknown as { qazinho: { signInPro: () => Promise<unknown> } }
      ).qazinho.signInPro(),
    );

    await page.locator('.update-required').waitFor();

    expect(await page.locator('.update-required__title').innerText()).toContain(
      'Atualize o QAzinho',
    );
    expect(await page.locator('.titlebar__meters').count()).toBe(0);
    expect((await stateOf()).isRequired).toBe(true);

    // O primeiro download acabou recusado pelo sistema: tentar de novo daria no mesmo.
    await page.getByRole('button', { name: 'Baixar do site' }).waitFor();
    await later(400);
    await page.screenshot({ path: join(tmpdir(), 'qazinho-update-failed.png') });

    await tell({ phase: 'downloading', version: VERSION, percent: 42, isRequired: true });
    await page.locator('.update-required__bar').waitFor();
    await later(500);
    expect(await page.locator('.update-required__note').innerText()).toContain('42');
    await page.screenshot({ path: join(tmpdir(), 'qazinho-update-working.png') });

    await tell({ phase: 'ready', version: VERSION, isRequired: true });
    await page.getByRole('button', { name: 'Reiniciar e atualizar' }).waitFor();
    await later(400);
    await page.screenshot({ path: join(tmpdir(), 'qazinho-update-ready.png') });
  });
});
