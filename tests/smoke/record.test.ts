import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mp4FactsOf } from '@/main/library';

/**
 * Um agente que responde as checagens do app, depois pensa pelo tempo que a run deixar.
 */
const THINKING_AGENT = `#!/usr/bin/env node
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
setInterval(() => undefined, 1000);
`;

/**
 * Uma página que nunca fica parada, para o screencast do Chrome continuar mandando frames
 * a gravar.
 */
const MOVING_PAGE = `<!doctype html><html><body style="margin:0;font:24px sans-serif">
<h1>Shop</h1><div id="box" style="width:120px;height:120px;background:#c6f432;animation:slide 1.5s linear infinite alternate"></div>
<style>@keyframes slide { from { margin-left: 0 } to { margin-left: 600px } }</style></body></html>`;

let app: ElectronApplication;
let page: Page;
let dataDir = '';
const said: string[] = [];

/**
 * Espera o MP4 da run ficar inteiro: o índice dele é escrito por último, então os fatos
 * só se leem aí.
 */
async function recorded(file: string) {
  for (let look = 0; look < 60; look += 1) {
    const facts = mp4FactsOf(await readFile(file).catch(() => null));

    if (facts !== null) return facts;

    await new Promise((later) => setTimeout(later, 500));
  }

  return null;
}

beforeAll(async () => {
  const site = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(MOVING_PAGE);
  });

  await new Promise<void>((ready) => site.listen(4347, '127.0.0.1', ready));

  const bin = await mkdtemp(join(tmpdir(), 'qazinho-record-bin-'));

  await writeFile(join(bin, 'claude'), THINKING_AGENT);
  await chmod(join(bin, 'claude'), 0o755);

  dataDir = await mkdtemp(join(tmpdir(), 'qazinho-record-'));
  await writeFile(
    join(dataDir, 'projects.json'),
    JSON.stringify([
      {
        id: 'p-1',
        name: 'Shop',
        targets: [
          { id: 't-web', kind: 'web', label: 'Web', value: 'http://127.0.0.1:4347/' },
        ],
      },
    ]),
  );
  await mkdir(join(dataDir, 'workspaces', 'w-1'), { recursive: true });
  await writeFile(
    join(dataDir, 'workspaces', 'w-1', 'plan.yaml'),
    'cases:\n  - id: TC-01\n    title: The shop opens\n    priority: P1\n    goal: ""\n    preconditions: ""\n    lastVerdict: null\n    steps:\n      - action: Look at the page\n        expected: It says Shop\n',
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
});

describe('recording a run', () => {
  /**
   * O gravador é uma janela escondida que codifica o stream vivo com WebCodecs: nada nos
   * testes unitários o roda, então é aqui que um codificador, muxer ou escrita quebrado
   * aparece.
   */
  it('writes an H.264 MP4 of the browser as it ran, and closes its hidden window after', async () => {
    await page.getByText('Shop regression').first().click();
    await page.getByRole('button', { name: 'Run plan' }).click();
    await page.waitForTimeout(6_000);
    await page.getByRole('button', { name: 'Stop', exact: true }).first().click();

    const file = join(dataDir, 'runs', 'w-1', 'r-01', 'run.mp4');
    const facts = await recorded(file);
    const bytes = await readFile(file);

    expect(facts).not.toBeNull();
    expect(facts?.durationMs).toBeGreaterThan(2_000);
    expect(facts).toMatchObject({ width: 1280, height: 800 });
    expect(bytes.includes(Buffer.from('avc1'))).toBe(true);

    await page.waitForTimeout(1_000);

    expect(
      await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length),
    ).toBe(1);
    expect(said).toEqual([]);
  });
});
