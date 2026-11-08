import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PORT = 4367;

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

const REPLY =
  'Olhei o painel. **O botão** diz outra coisa, e o resto bate com o que você disse.';

/**
 * Um agente fake que escreve como a CLI real: no chat, a resposta em pedaços dentro do JSON
 * dela; na run, olha a tela, registra um bug com o tipo dele e passa o passo.
 */
const AGENT = `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
if (argv[0] === 'mcp') process.exit(0);
const later = (ms) => new Promise((wake) => setTimeout(wake, ms));
const say = (line) => process.stdout.write(JSON.stringify(line) + '\\n');
const tool = (name, input) => say({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
process.on('SIGINT', () => process.exit(0));
process.stdin.resume();
process.stdin.on('end', async () => {
  say({ type: 'system', subtype: 'init', session_id: 's-1' });
  if (argv.includes('--json-schema')) {
    const whole = JSON.stringify({ reply: ${JSON.stringify(REPLY)} });
    say({ type: 'stream_event', event: { type: 'content_block_start', content_block: { type: 'tool_use', name: 'StructuredOutput' } } });
    for (let at = 0; argv.includes('--include-partial-messages') && at < whole.length; at += 8) {
      say({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: whole.slice(at, at + 8) } } });
      await later(120);
    }
    say({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'StructuredOutput', input: { reply: ${JSON.stringify(REPLY)} } }] } });
    say({ type: 'result', session_id: 's-1', is_error: false, result: '' });
    return;
  }
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const call = async (name, args) => {
    tool('mcp__qazinho__' + name, args);
    await later(700);
    return client.callTool({ name, arguments: args });
  };
  await call('look', {});
  await call('bug', { title: 'Botão diz Enviar, e não Salvar', severity: 'medium', expected: 'Salvar', got: 'Enviar', category: 'text' });
  await later(1500);
  await call('report', { step: 1, verdict: 'passed', why: 'Abriu', got: 'Painel', proof: 'Painel' });
  await client.close();
  say({ type: 'result', session_id: 's-1', is_error: false, result: 'done' });
});
`;

const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(
    '<!doctype html><html lang="pt"><h1>Painel</h1><button>Enviar</button></html>',
  );
});

let app: ElectronApplication;
let page: Page;

beforeAll(async () => {
  await new Promise<void>((ready) => {
    site.listen(PORT, '127.0.0.1', ready);
  });

  const dataDir = await mkdtemp(join(tmpdir(), 'qazinho-caught-'));
  const bin = await mkdtemp(join(tmpdir(), 'qazinho-caught-bin-'));
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
  await writeFile(
    join(folder, 'plan.yaml'),
    `cases:
  - id: TC-01
    title: "Abrir o painel"
    priority: P1
    goal: ""
    preconditions: ""
    lastVerdict: null
    steps:
      - action: "Abrir o painel"
        expected: "O painel aparece"
`,
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
  await page.waitForSelector('.titlebar');
  await page.getByText('Loja', { exact: true }).first().click();
  await page.getByText('Painel', { exact: true }).first().click();
}, 60_000);

afterAll(async () => {
  await app.close();
  site.close();
});

describe('a turn and a run that say what they are doing', () => {
  it('writes the reply as it comes, and keeps it when the turn ends', async () => {
    const composer = page.getByPlaceholder(/Pergunte ao agente/).first();

    await composer.fill('O que tem no painel?');
    await composer.press('Enter');
    await page.waitForFunction(
      () => {
        const web = globalThis as unknown as {
          document: {
            querySelector: (selector: string) => { textContent: string } | null;
          };
        };

        return (
          (web.document.querySelector('.chat__live .markdown')?.textContent.length ?? 0) >
          10
        );
      },
      undefined,
      { timeout: 20_000 },
    );

    const halfway = await page.locator('.chat__live .markdown').textContent();

    expect(halfway?.length).toBeLessThan(REPLY.length - 8);
    await expect
      .poll(() => page.locator('.chat__live').count(), { timeout: 20_000 })
      .toBe(0);
    expect(await page.locator('.chat-row .markdown').last().textContent()).toContain(
      'O botão diz outra coisa',
    );
  }, 60_000);

  it('tells what the agent does in the chat, while the run goes on', async () => {
    await page.getByRole('button', { name: 'Rodar plano' }).click();
    await page
      .locator('.run-section--live .run-activity__text', { hasText: 'Lendo a tela' })
      .waitFor({ timeout: 30_000 });
  }, 60_000);

  it('flashes a caught bug on the screen, saying what it is, and gets out of the way', async () => {
    const flash = page.locator('.bug-flash');

    await flash.waitFor({ timeout: 30_000 });

    expect(await flash.locator('.bug-flash__headline').textContent()).toBe(
      'Texto incorreto',
    );
    expect(await flash.locator('.bug-flash__detail').textContent()).toBe(
      'Botão diz Enviar, e não Salvar',
    );
    expect(await flash.locator('.bug-flash__image').count()).toBe(1);
    await flash.waitFor({ state: 'detached', timeout: 12_000 });
  }, 60_000);
});
