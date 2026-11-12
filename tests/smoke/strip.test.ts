import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mp4FactsOf } from '@/main/library';
import { fingerprintOf } from '@salve-software/qazinho-harness/engine';

const PORT = 4359;

/** Um agente que só responde as checagens do app: a run repete a gravação sozinha. */
const IDLE_AGENT = `#!/usr/bin/env node
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
setInterval(() => undefined, 1000);
`;

/**
 * Uma página que nunca fica parada, carrega o carrinho sozinha e paga num clique, que
 * falha.
 */
const SHOP = `<!doctype html><html><body style="margin:0;font:24px sans-serif">
<h1>Shop</h1><div style="width:120px;height:120px;background:#c6f432;animation:slide 1.5s linear infinite alternate"></div>
<button onclick="fetch('/api/pay', { method: 'POST' }).then(() => { document.getElementById('out').textContent = 'Payment refused'; })">Pay</button>
<p id="out"></p>
<style>@keyframes slide { from { margin-left: 0 } to { margin-left: 600px } }</style>
<script>fetch('/api/cart');</script></body></html>`;

const site = createServer((request, response) => {
  if (request.url === '/api/cart') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('[]');

    return;
  }

  if (request.url === '/api/pay') {
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end('{"error":"declined"}');

    return;
  }

  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(SHOP);
});

let app: ElectronApplication;
let page: Page;
let dataDir = '';
const said: string[] = [];

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));

  const bin = await mkdtemp(join(tmpdir(), 'qazinho-network-video-bin-'));

  await writeFile(join(bin, 'claude'), IDLE_AGENT);
  await chmod(join(bin, 'claude'), 0o755);

  dataDir = await mkdtemp(join(tmpdir(), 'qazinho-network-video-'));
  await writeFile(
    join(dataDir, 'projects.json'),
    JSON.stringify([
      {
        id: 'p-1',
        name: 'Shop',
        targets: [
          {
            id: 't-web',
            kind: 'web',
            label: 'Web',
            value: `http://127.0.0.1:${String(PORT)}/`,
          },
        ],
      },
    ]),
  );
  await mkdir(join(dataDir, 'workspaces', 'w-1'), { recursive: true });
  await writeFile(
    join(dataDir, 'workspaces', 'w-1', 'plan.yaml'),
    'cases:\n  - id: TC-01\n    title: Paying is refused\n    priority: P1\n    goal: ""\n    preconditions: ""\n    lastVerdict: null\n    steps:\n      - action: Pay for the cart\n        expected: The shop says the payment was refused\n',
  );
  await writeFile(
    join(dataDir, 'workspaces', 'w-1', 'recipes.json'),
    JSON.stringify({
      cases: [
        {
          caseId: 'TC-01',
          fingerprint: fingerprintOf({
            targetKind: 'web',
            steps: [
              {
                caseId: 'TC-01',
                caseTitle: 'Paying is refused',
                casePriority: 'P1',
                caseGoal: '',
                casePreconditions: '',
                numberInCase: 1,
                action: 'Pay for the cart',
                expected: 'The shop says the payment was refused',
              },
            ],
          }),
          targetKind: 'web',
          steps: [
            {
              number: 1,
              actions: [
                { kind: 'wait', target: '', value: '1500' },
                { kind: 'click', target: 'Pay', value: '' },
                { kind: 'wait', target: '', value: '1500' },
              ],
              proof: 'Shop',
            },
          ],
          runId: 'r-00',
          recordedAt: 0,
        },
      ],
    }),
  );
  await writeFile(
    join(dataDir, 'workspaces', 'w-1', 'workspace.json'),
    JSON.stringify({
      id: 'w-1',
      projectId: 'p-1',
      name: 'Shop regression',
      targetId: 't-web',
      planKind: 'web',
      status: 'idle',
      chat: [],
      runs: [],
      bugs: [],
      viewportId: 'desktop',
    }),
  );

  app = await electron.launch({
    args: [join(process.cwd(), 'out', 'main', 'index.js'), `--user-data-dir=${dataDir}`],
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` },
  });
  page = await app.firstWindow();
  page.on('pageerror', (reason) => said.push(reason.message));
  await page.waitForSelector('.titlebar');
  await page.evaluate(() => {
    localStorage.setItem(
      'qazinho.settings',
      JSON.stringify({
        state: { agent: 'Claude Code', model: '', language: 'en', hasOnboarded: true },
        version: 1,
      }),
    );
  });
  await page.reload();
  await page.waitForSelector('.titlebar');
}, 120_000);

afterAll(async () => {
  await app.close();
  site.close();
});

describe("a run's video with its network", () => {
  /**
   * A faixa é desenhada pela página e o download é recodificado lá com WebCodecs: nada
   * nos testes unitários decodifica ou codifica, então é aqui que um compositor quebrado
   * aparece.
   */
  it('shows the requests under the video, and downloads the video with them drawn in', async () => {
    const target = join(dataDir, 'with-network.mp4');

    await page.getByText('Shop', { exact: true }).first().click();
    await page.getByText('Shop regression').first().click();
    await page.getByRole('button', { name: 'Run plan' }).click();
    await page
      .getByRole('tab', { name: /^Runs/ })
      .or(page.getByRole('button', { name: /^Runs/ }))
      .first()
      .click();
    await page
      .getByRole('button', { name: 'Watch the run' })
      .first()
      .click({ timeout: 90_000 });
    await page.waitForSelector('.run-replay__video');
    await page.getByRole('switch', { name: 'Network' }).click();
    await page.locator('.replay-network__button').first().waitFor({ timeout: 10_000 });

    const kept = JSON.parse(
      await readFile(join(dataDir, 'runs', 'w-1', 'r-01', 'network.json'), 'utf8'),
    ) as { method: string; url: string; status: number | null }[];

    expect(
      kept.map(({ method, url, status }) => `${method} ${url} ${String(status)}`),
    ).toEqual(
      expect.arrayContaining([
        `GET http://127.0.0.1:${String(PORT)}/ 200`,
        `GET http://127.0.0.1:${String(PORT)}/api/cart 200`,
        `POST http://127.0.0.1:${String(PORT)}/api/pay 500`,
      ]),
    );

    await app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: file });
    }, target);
    await page.getByRole('button', { name: 'Download' }).click();
    await page.getByRole('button', { name: 'Saved' }).waitFor({ timeout: 60_000 });

    const recording = mp4FactsOf(
      await readFile(join(dataDir, 'runs', 'w-1', 'r-01', 'run.mp4')),
    );
    const composed = mp4FactsOf(await readFile(target));

    expect(composed?.width).toBe(recording?.width);
    expect(composed?.height).toBeGreaterThan(recording?.height ?? 0);
    expect(
      Math.abs((composed?.durationMs ?? 0) - (recording?.durationMs ?? 0)),
    ).toBeLessThan(500);
    expect(said).toEqual([]);
  }, 180_000);

  /** Um clique numa linha levava o vídeo até o pedido; num do começo parecia recarregar. */
  it('opens a request in detail, with what a failed call answered, and closes it alone', async () => {
    await page.evaluate(() => {
      const web = globalThis as unknown as {
        document: {
          querySelector: (
            selector: string,
          ) => { currentTime: number; duration: number } | null;
        };
      };
      const video = web.document.querySelector('.run-replay__video');

      if (video !== null) video.currentTime = video.duration;
    });
    await page
      .locator('.replay-network__button')
      .filter({ hasText: '/api/pay' })
      .first()
      .click({ timeout: 10_000 });

    const detail = page.getByRole('dialog', { name: /POST \/api\/pay/ });

    await detail.waitFor();

    await expect(detail.textContent()).resolves.toContain('500');
    await expect(detail.textContent()).resolves.toContain('{"error":"declined"}');

    await page.keyboard.press('Escape');
    await detail.waitFor({ state: 'detached' });

    expect(await page.locator('.run-replay__video').count()).toBe(1);
    expect(said).toEqual([]);
  }, 60_000);
});
