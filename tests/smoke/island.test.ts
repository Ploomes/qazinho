import type { IIslandQuestion, IslandState } from '@/shared/types';
import type { ElectronApplication, Page } from 'playwright-core';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: ElectronApplication;
let page: Page;
let island: Page;

const later = (ms: number) => new Promise((wake) => setTimeout(wake, ms));

const question = (id: string, over: Partial<IIslandQuestion> = {}): IIslandQuestion => ({
  workspaceId: `w-${id}`,
  questionId: `q-${id}`,
  project: 'Loja',
  workspace: 'Compra',
  question: 'Qual tamanho devo escolher?',
  options: ['P', 'M', 'G'],
  isSecret: false,
  ...over,
});

/** O que a página principal manda à ilha, pela bridge real. */
async function show(state: IslandState) {
  await page.evaluate((shown) => {
    const web = globalThis as unknown as {
      qazinho: { setIsland: (island: object) => void };
    };

    web.qazinho.setIsland({ language: 'pt', state: shown });
  }, state);
  await later(300);
}

/** O mouse sobre o notch, que abre a ilha, ou longe dele, que a deixa fechar. */
async function hover(isOver: boolean) {
  await island.mouse.move(isOver ? 230 : 5, isOver ? 10 : 370);
  await later(600);
}

/** A altura do pill a cada quadro enquanto algo acontece com ele. */
async function heightsDuring(action: () => Promise<void>): Promise<number[]> {
  await island.evaluate(() => {
    const web = globalThis as unknown as {
      document: {
        querySelector: (selector: string) => {
          getBoundingClientRect: () => { height: number };
        } | null;
      };
      requestAnimationFrame: (next: () => void) => void;
      heights: number[];
      isWatching: boolean;
    };

    web.heights = [];
    web.isWatching = true;

    const look = () => {
      if (!web.isWatching) return;

      const box = web.document.querySelector('.island__pill')?.getBoundingClientRect();

      web.heights.push(Math.round(box?.height ?? 0));
      web.requestAnimationFrame(look);
    };

    web.requestAnimationFrame(look);
  });
  await action();

  return island.evaluate(() => {
    const web = globalThis as unknown as { heights: number[]; isWatching: boolean };

    web.isWatching = false;

    return web.heights;
  });
}

async function windowFacts() {
  return app.evaluate(({ BrowserWindow }) => {
    const open = BrowserWindow.getAllWindows().find((one) =>
      one.webContents.getURL().includes('island'),
    );

    return {
      bounds: open?.getBounds(),
      isVisible: open?.isVisible(),
      isOnTop: open?.isAlwaysOnTop(),
      isFocused: open?.isFocused(),
    };
  });
}

beforeAll(async () => {
  app = await electron.launch({
    args: [
      join(process.cwd(), 'out', 'main', 'index.js'),
      `--user-data-dir=${await mkdtemp(join(tmpdir(), 'qazinho-island-'))}`,
    ],
  });
  page = await app.firstWindow();
  await page.waitForSelector('.titlebar');
  await show({
    kind: 'running',
    workspaceId: 'w-1',
    name: 'Compra',
    detail: 'Abrir a loja',
    done: 1,
    total: 4,
    isExploring: false,
    isPaused: false,
  });

  for (let look = 0; look < 40; look += 1) {
    const found = app.windows().find((one) => one.url().includes('island'));

    if (found !== undefined) {
      island = found;
      break;
    }

    await later(150);
  }

  await island.waitForSelector('.island__pill');
}, 60_000);

afterAll(async () => {
  await app.close();
});

describe('the island', () => {
  it('sits on the top edge, over everything', async () => {
    expect(await windowFacts()).toMatchObject({
      bounds: { y: 0 },
      isVisible: true,
      isOnTop: true,
    });
  });

  /** O CSS base pintava o `body`, e a janela inteira virava um retângulo preto. */
  it('paints only the pill, so the screen shows around it', async () => {
    const paints = await island.evaluate(() => {
      const web = globalThis as unknown as {
        document: { querySelector: (selector: string) => object };
        getComputedStyle: (one: object) => { backgroundColor: string };
      };

      return ['html', 'body', '#root', '.island'].map(
        (selector) =>
          web.getComputedStyle(web.document.querySelector(selector)).backgroundColor,
      );
    });

    expect(new Set(paints)).toEqual(new Set(['rgba(0, 0, 0, 0)']));
  });

  /**
   * O `visibleOnFullScreen` do Electron esconde o app do Dock por padrão, e com ele a
   * contagem de runs no ícone.
   */
  it.runIf(process.platform === 'darwin')('keeps the app in the Dock', async () => {
    expect(
      await app.evaluate(({ app: electronApp }) => electronApp.dock?.isVisible()),
    ).toBe(true);
  });

  /** Uma altura fixa por estado cortava os botões; este é o pior caso do que cabe nela. */
  it('fits the longest question inside the window, with nothing cut', async () => {
    await show({
      kind: 'asking',
      questions: [
        question('long', {
          question: 'Qual endereço usar neste pedido? '.repeat(14),
          options: Array.from(
            { length: 4 },
            (_, at) => `Uma opção bem comprida ${String(at)}`,
          ),
        }),
        question('other'),
      ],
    });
    await hover(true);

    const pill = await island.locator('.island__pill').boundingBox();
    const field = await island.locator('.island-ask__field').boundingBox();
    const { bounds } = await windowFacts();
    const pillBottom = (pill?.y ?? 0) + (pill?.height ?? 0);

    expect((field?.y ?? Infinity) + (field?.height ?? 0)).toBeLessThan(pillBottom);
    expect(pillBottom).toBeLessThanOrEqual(bounds?.height ?? 0);
    await hover(false);
  });

  /**
   * Medindo o conteúdo com o pill ainda estreito, o texto quebrava em mais linhas: a altura
   * passava da final e voltava, um flick, e ao fechar pulava de novo.
   */
  it('opens and closes without passing its final height', async () => {
    await show({
      kind: 'asking',
      questions: [
        question('flick', {
          question: 'Qual tamanho devo escolher para esta camiseta azul da loja? '.repeat(
            3,
          ),
        }),
      ],
    });

    const opening = await heightsDuring(() => hover(true));
    const closing = await heightsDuring(() => hover(false));
    const closed = opening[0] ?? 0;
    const open = opening.at(-1) ?? 0;

    expect(open).toBeGreaterThan(closed);
    expect(Math.max(...opening)).toBeLessThanOrEqual(open + 1);
    expect(closing.at(-1)).toBe(closed);
    expect(Math.min(...closing)).toBeGreaterThanOrEqual(closed);
  });

  it('animates its height when the arrows land on a question of another size', async () => {
    await show({
      kind: 'asking',
      questions: [
        question('short', { question: 'Qual tamanho?' }),
        question('tall', {
          question: 'Qual endereço usar neste pedido da loja de camisetas? '.repeat(4),
        }),
      ],
    });
    await hover(true);

    const moving = await heightsDuring(async () => {
      await island.getByRole('button', { name: 'Próxima pergunta' }).click();
      await later(600);
    });

    expect(new Set(moving).size).toBeGreaterThan(3);
    await hover(false);
  });

  it('stays closed when an agent asks, and counts the questions on its ear', async () => {
    await show({ kind: 'asking', questions: [question('1'), question('2')] });

    expect(await island.locator('.island-ask').count()).toBe(0);
    expect(await island.locator('.island__count').textContent()).toBe('2');
  });

  it('walks the questions with the arrows, naming where each came from', async () => {
    await show({
      kind: 'asking',
      questions: [
        question('1'),
        question('2', {
          project: 'Painel',
          workspace: 'Convite',
          question: 'Qual e-mail uso?',
          options: [],
        }),
      ],
    });
    await hover(true);

    expect(await island.locator('.island-ask__title').textContent()).toBe(
      'Loja · Compra',
    );

    await island.getByRole('button', { name: 'Próxima pergunta' }).click();

    expect(await island.locator('.island-ask__title').textContent()).toBe(
      'Painel · Convite',
    );
    expect(await island.locator('.island-ask__position').textContent()).toBe('2 de 2');
    await hover(false);
  });

  it('takes the keyboard while the QA types, stays open, and gives it back on Esc', async () => {
    await show({ kind: 'asking', questions: [question('3', { options: [] })] });
    await hover(true);

    expect((await windowFacts()).isFocused).toBe(false);

    await island.locator('.island-ask__field input').click();
    await later(400);

    expect((await windowFacts()).isFocused).toBe(true);

    await island.keyboard.type('qa@loja.test');
    await hover(false);

    expect(await island.locator('.island-ask').count()).toBe(1);

    await island.keyboard.press('Escape');
    await later(600);

    expect((await windowFacts()).isFocused).toBe(false);
    expect(await island.locator('.island-ask').count()).toBe(0);

    await hover(true);

    expect(await island.locator('.island-ask__field input').inputValue()).toBe(
      'qa@loja.test',
    );
    await hover(false);
  });

  /** Um segredo não passa pela ilha: o cartão do chat é o único lugar que o digita. */
  it('has no field for a secret, only the way to the app', async () => {
    await show({
      kind: 'asking',
      questions: [question('4', { options: [], isSecret: true })],
    });
    await hover(true);

    expect(await island.locator('input').count()).toBe(0);
    expect(await island.getByRole('button', { name: 'Responder no app' }).count()).toBe(
      1,
    );
    await hover(false);
  });

  it('hides when there is nothing to say', async () => {
    await show({ kind: 'idle' });

    expect((await windowFacts()).isVisible).toBe(false);
  });
});
