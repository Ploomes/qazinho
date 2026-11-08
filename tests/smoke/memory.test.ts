import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PORT = 4372;
const BASE = `http://127.0.0.1:${String(PORT)}`;
const WHERE = 'Os formulários ficam em Ajustes.';

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

/**
 * Um agente fake: sem memória, pergunta ao QA onde fica o formulário; com ela, diz que já
 * sabe, nos dois casos. Como guardião, anota a resposta do QA e esquece quando mandado.
 */
const AGENT = `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
if (argv[0] === 'mcp') process.exit(0);
const out = (line) => process.stdout.write(JSON.stringify(line) + '\\n');
process.on('SIGINT', () => process.exit(0));
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  out({ type: 'system', subtype: 'init', session_id: 's-1' });
  const finish = (result) => out({ type: 'result', session_id: 's-1', is_error: false, result, structured_output: JSON.parse(result) });
  if (prompt.includes('What changes in what QAzinho keeps?')) {
    const kept = /\\[(m-[0-9a-f]+)\\]/.exec(prompt);
    if (prompt.includes('Esquece') && kept) return finish(JSON.stringify({ ops: [{ op: 'delete', id: kept[1] }] }));
    if (prompt.includes('The QA answered:')) return finish(JSON.stringify({ ops: [{ op: 'add', text: ${JSON.stringify(WHERE)}, scope: 'project', target: 'all' }] }));
    return finish(JSON.stringify({ ops: [] }));
  }
  if (prompt.includes('<qazinho>') && !prompt.includes('Carry out these steps')) return finish(JSON.stringify({ reply: 'Certo.', plan: null, questions: [] }));
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const call = (name, args) => client.callTool({ name, arguments: args });
  const known = /\\[(m-[0-9a-f]+)\\] /.exec(prompt);
  if (known) await call('say', { text: 'Pelo que já aprendi, vou por Ajustes.', memory: known[1] });
  else await call('ask_qa', { question: 'Onde ficam os formulários?' });
  await call('report', { step: 1, verdict: 'passed', why: 'Certo', got: 'Painel' });
  await client.close();
  out({ type: 'result', session_id: 's-1', is_error: false, result: 'done' });
});
`;

const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><html lang="pt"><body><h1>Painel</h1></body></html>');
});

const caseOf = (id: string) => `  - id: ${id}
    title: "Abrir ${id}"
    priority: P1
    goal: ""
    preconditions: ""
    lastVerdict: null
    steps:
      - action: "Abrir"
        expected: "Certo"
`;

let app: ElectronApplication;
let page: Page;
let dataDir: string;

const notesOf = () => page.locator('.memory-note__line').allTextContents();
const onDisk = async () =>
  (
    JSON.parse(await readFile(join(dataDir, 'projects.json'), 'utf8')) as {
      memories?: { text: string; deletedAt: string | null }[];
    }[]
  )[0]?.memories ?? [];

const walkPlan = async () => {
  await page.getByRole('button', { name: 'Desenvolver plano' }).click();

  let asked = 0;

  for (let turn = 0; turn < 300; turn += 1) {
    if (await page.locator('.ask-card__question').count()) {
      asked += 1;
      await page.evaluate(
        (id) =>
          (
            globalThis as unknown as {
              qazinho: { answerRun: (ask: unknown) => void };
            }
          ).qazinho.answerRun({
            workspaceId: 'w-1',
            questionId: id,
            reply: { kind: 'said', text: 'Em Ajustes.' },
          }),
        `q-${String(asked)}`,
      );
      await new Promise((wake) => setTimeout(wake, 300));
    }

    if (await page.locator('.device-off__title').count()) return asked;

    await new Promise((wake) => setTimeout(wake, 200));
  }

  throw new Error('the run never ended');
};

beforeAll(async () => {
  await new Promise<void>((ready) => {
    site.listen(PORT, '127.0.0.1', ready);
  });

  dataDir = await mkdtemp(join(tmpdir(), 'qazinho-memory-'));

  const bin = await mkdtemp(join(tmpdir(), 'qazinho-memory-bin-'));
  const folder = join(dataDir, 'workspaces', 'w-1');

  await writeFile(join(bin, 'claude'), AGENT);
  await chmod(join(bin, 'claude'), 0o755);
  await mkdir(folder, { recursive: true });
  await writeFile(
    join(dataDir, 'projects.json'),
    JSON.stringify([
      {
        id: 'p-1',
        name: 'Loja',
        targets: [{ id: 't-web', kind: 'web', label: 'Web', value: `${BASE}/` }],
        repositories: [],
      },
    ]),
  );
  await writeFile(
    join(folder, 'plan.yaml'),
    `cases:\n${caseOf('TC-01')}${caseOf('TC-02')}`,
  );
  await writeFile(
    join(folder, 'workspace.json'),
    JSON.stringify({
      id: 'w-1',
      projectId: 'p-1',
      name: 'Painel',
      targetId: 't-web',
      planKind: 'web',
      status: 'idle',
      viewportId: 'desktop',
      chat: [],
      runs: [],
      bugs: [],
    }),
  );

  app = await electron.launch({
    args: [join(process.cwd(), 'out', 'main', 'index.js'), `--user-data-dir=${dataDir}`],
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` },
  });
  page = await app.firstWindow();
  await page.waitForSelector('.titlebar');
  await page.evaluate(() => {
    (
      globalThis as unknown as {
        localStorage: { setItem: (key: string, value: string) => void };
      }
    ).localStorage.setItem(
      'qazinho.settings',
      JSON.stringify({
        state: { agent: 'Claude Code', language: 'pt', hasOnboarded: true },
        version: 1,
      }),
    );
  });
  await page.reload();
  await page.waitForSelector('.titlebar');
  await page.getByText('Loja', { exact: true }).first().click();
  await page.getByText('Painel', { exact: true }).first().click();
}, 60_000);

afterAll(async () => {
  await app.close().catch(() => undefined);
  site.close();
});

describe('what the agent learns', () => {
  it('keeps what the QA answered in a run, and says so in the chat', async () => {
    await walkPlan();
    await expect.poll(notesOf, { timeout: 20_000 }).toEqual([`Anotei: ${WHERE}`]);
    await expect.poll(onDisk, { timeout: 5_000 }).toMatchObject([{ text: WHERE }]);
  }, 90_000);

  it('hands it to the next run, which asks nothing and says it once', async () => {
    await page.reload();
    await page.waitForSelector('.titlebar');
    expect(await walkPlan()).toBe(0);

    await expect
      .poll(
        async () =>
          (
            JSON.parse(
              await readFile(
                join(dataDir, 'workspaces', 'w-1', 'workspace.json'),
                'utf8',
              ),
            ) as { chat: { kind: string; text?: string }[] }
          ).chat.filter(
            ({ kind, text }) => kind === 'note' && text?.includes('Pelo que já aprendi'),
          ).length,
        { timeout: 10_000 },
      )
      .toBe(1);
  }, 90_000);

  it('forgets when the QA says so in the chat', async () => {
    const box = page.locator('.composer__input').first();

    await box.fill('Esquece o que você anotou sobre os formulários.');
    await box.press('Enter');

    await expect.poll(notesOf, { timeout: 20_000 }).toContain(`Esqueci: ${WHERE}`);
    await expect
      .poll(async () => (await onDisk())[0]?.deletedAt ?? null, { timeout: 5_000 })
      .not.toBeNull();
  }, 60_000);
});
