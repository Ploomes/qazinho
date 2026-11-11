import type { ElectronApplication, Page } from 'playwright-core';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: ElectronApplication;
let page: Page;

const later = (ms: number) => new Promise((wake) => setTimeout(wake, ms));

/** A janela principal, vista da main: a ilha e o gravador ficam de fora. */
async function mainWindow() {
  return app.evaluate(({ BrowserWindow }) => {
    const open = BrowserWindow.getAllWindows().find((one) =>
      one.webContents.getURL().includes('index.html'),
    );

    return open === undefined
      ? null
      : {
          isVisible: open.isVisible(),
          isDestroyed: open.isDestroyed(),
          isFullScreen: open.isFullScreen(),
        };
  });
}

async function until(check: () => Promise<boolean>, ms = 8000) {
  for (let waited = 0; waited < ms; waited += 150) {
    if (await check()) return true;

    await later(150);
  }

  return false;
}

beforeAll(async () => {
  app = await electron.launch({
    args: [
      join(process.cwd(), 'out', 'main', 'index.js'),
      `--user-data-dir=${await mkdtemp(join(tmpdir(), 'qazinho-close-'))}`,
    ],
  });
  page = await app.firstWindow();
  await page.waitForSelector('.titlebar');
  await until(async () => (await mainWindow())?.isVisible === true);
}, 60_000);

afterAll(async () => {
  if (app.process().exitCode === null) await app.close();
});

describe('closing the window', () => {
  /** Como o Discord: fechar a janela não fecha o app, e uma run segue andando. */
  it('hides the window and keeps the page alive', async () => {
    await page.evaluate(() => {
      (globalThis as unknown as { keptAlive: string }).keptAlive = 'still here';
    });
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()
        .find((one) => one.webContents.getURL().includes('index.html'))
        ?.close();
    });
    await later(500);

    expect(await mainWindow()).toMatchObject({ isVisible: false, isDestroyed: false });
    expect(app.process().exitCode).toBeNull();
    expect(
      await page.evaluate(
        () => (globalThis as unknown as { keptAlive: string }).keptAlive,
      ),
    ).toBe('still here');
  });

  it('comes back as it was when the Dock icon is clicked', async () => {
    await app.evaluate(({ app: electronApp }) => {
      electronApp.emit('activate');
    });

    expect(await until(async () => (await mainWindow())?.isVisible === true)).toBe(true);
    expect(
      await page.evaluate(
        () => (globalThis as unknown as { keptAlive: string }).keptAlive,
      ),
    ).toBe('still here');
  });

  /** Esconder uma janela em tela cheia deixa no Mac um espaço preto onde ela estava. */
  it.runIf(process.platform === 'darwin')(
    'leaves full screen before hiding',
    async () => {
      await app.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()
          .find((one) => one.webContents.getURL().includes('index.html'))
          ?.setFullScreen(true);
      });
      await until(async () => (await mainWindow())?.isFullScreen === true);
      await later(1200);
      await app.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()
          .find((one) => one.webContents.getURL().includes('index.html'))
          ?.close();
      });

      expect(
        await until(async () => {
          const open = await mainWindow();

          return open?.isVisible === false && !open.isFullScreen;
        }),
      ).toBe(true);
    },
    20_000,
  );

  it('really quits when the app is told to quit', async () => {
    const exited = new Promise<number | null>((done) => {
      app.process().once('exit', (code) => {
        done(code);
      });
    });

    await app.evaluate(({ app: electronApp }) => {
      electronApp.quit();
    });

    expect(await Promise.race([exited, later(10_000).then(() => 'hung')])).toBe(0);
  }, 15_000);
});
