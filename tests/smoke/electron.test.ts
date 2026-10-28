import type { ElectronApplication, Page } from 'playwright-core';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: ElectronApplication;
let page: Page;
const said: string[] = [];
const sizes: { welcome: number[] | null; app: number[] | null } = {
  welcome: null,
  app: null,
};

/**
 * O tamanho da janela depois que ela está na tela, ou nada enquanto ainda está escondida.
 */
async function shownSize(): Promise<number[] | null> {
  return app.evaluate(({ BrowserWindow }) => {
    const [open] = BrowserWindow.getAllWindows();

    return open?.isVisible() === true ? open.getSize() : null;
  });
}

/**
 * Faz polling na janela até o tamanho dela ser o que `isDone` espera; um resize anima no
 * macOS.
 */
async function sizeOnce(isDone: (size: number[] | null) => boolean) {
  for (let look = 0; look < 40; look += 1) {
    const size = await shownSize();

    if (isDone(size)) return size;

    await new Promise((later) => setTimeout(later, 100));
  }

  return shownSize();
}

/**
 * O popover de recursos redesenha a cada varredura, então o X dele se move até a lista
 * assentar.
 */
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
      // Electron: uma pasta de dados própria, para uma run aqui nunca tocar os projetos
      // reais do QA.
      `--user-data-dir=${await mkdtemp(join(tmpdir(), 'qazinho-e2e-'))}`,
    ],
  });

  page = await app.firstWindow();

  page.on('console', (message) => {
    if (message.type() === 'error') said.push(message.text());
  });
  page.on('pageerror', (reason) => said.push(reason.message));

  await page.waitForSelector('.titlebar');
  sizes.welcome = await sizeOnce((size) => size !== null);
  // Uma pasta de dados nova é uma primeira execução: depois da configuração está o app
  // que estes testes olham.
  await page.locator('.onboarding__skip').click();
  sizes.app = await sizeOnce((size) => size?.[0] !== sizes.welcome?.[0]);
}, 120_000);

afterAll(async () => {
  await app.close();
});

describe('the real window', () => {
  /** A janela abre escondida, e a página diz que tamanho quer antes de ela aparecer. */
  it('opens small for the welcome, and grows to full once the QA is in', () => {
    expect(sizes.welcome).toEqual([1120, 740]);
    expect(sizes.app).toEqual([1440, 900]);
  });

  it('opens, and the bridge answers', async () => {
    expect(await page.locator('.titlebar').count()).toBe(1);
    const bridge = await page.evaluate(() => {
      // O callback roda na página, onde `window` não está na lib deste projeto.
      const web = globalThis as unknown as { qazinho?: unknown };

      return typeof web.qazinho;
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

    await page.locator('.model-popover__row', { hasText: /^Opus/ }).click();
    await page.waitForTimeout(300);

    expect(await page.locator('.titlebar').innerText()).toContain('· Opus');
  });

  it('opens the OS file picker from the android field', async () => {
    // O diálogo é modal e bloqueia o processo main, então ele é observado, não clicado.
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
