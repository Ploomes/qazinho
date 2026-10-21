import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mp4FactsOf } from '@/main/library';

const PORT = 4359;

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

/** An agent that answers the app's checks, then pays on the page and passes the step. */
const PAYING_AGENT = `#!/usr/bin/env node
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const later = (ms) => new Promise((done) => setTimeout(done, ms));
process.stdin.on('data', () => undefined);
process.stdin.on('end', async () => {
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  await later(1500);
  await client.callTool({ name: 'click', arguments: { target: 'Pay' } });
  await later(1500);
  await client.callTool({ name: 'report', arguments: {
    step: 1, verdict: 'passed', why: 'The shop answered.', got: 'Payment refused', proof: 'Shop',
  } });
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.01 }));
});
`;

/** A page that never stands still, loads the cart on its own and pays on a click, which fails. */
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

  await writeFile(join(bin, 'claude'), PAYING_AGENT);
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
   * The strip is drawn by the page and the download is re-encoded there with WebCodecs: nothing
   * in the unit tests decodes or encodes, so this is where a broken composer shows.
   */
  it('shows the requests under the video, and downloads the video with them drawn in', async () => {
    const target = join(dataDir, 'with-network.mp4');

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
});
