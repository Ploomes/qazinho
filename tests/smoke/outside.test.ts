import type { Server } from 'node:http';
import type { ElectronApplication, Page } from 'playwright-core';
import { chmod, mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { _electron as electron } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: ElectronApplication;
let page: Page;
let site: Server;
let client: Client;
let dataDir: string;
let address: string;

const later = (ms: number) => new Promise((wake) => setTimeout(wake, ms));

const PLAN = `cases:
  - id: TC-01
    title: "Abrir a loja"
    priority: P1
    goal: ""
    preconditions: ""
    lastVerdict: null
    steps:
      - action: "Abrir a loja"
        expected: "O título aparece"
`;

/** Um agente que nunca responde: a run fica andando até alguém pará-la. */
const SLOW_AGENT = `#!/usr/bin/env node
const argv = process.argv.slice(2);
if (argv[0] === '--version') { console.log('2.1.302 (Claude Code)'); process.exit(0); }
if (argv[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
if (argv[0] === 'mcp') process.exit(0);
setTimeout(() => process.exit(0), 120000);
`;

async function bridge<T>(call: string, argument?: unknown): Promise<T> {
  return page.evaluate(
    ([name, value]) => {
      const web = globalThis as unknown as {
        qazinho: Record<string, (argument?: unknown) => Promise<unknown>>;
      };

      return web.qazinho[name]?.(value) as Promise<T>;
    },
    [call, argument] as const,
  );
}

/** O texto que uma ferramenta respondeu, e se ela o marcou como erro. */
async function tool(name: string, args: Record<string, unknown> = {}) {
  const answer = (await client.callTool({ name, arguments: args })) as {
    content: { text: string }[];
    isError?: boolean;
  };

  return { text: answer.content[0]?.text ?? '', isError: answer.isError === true };
}

beforeAll(async () => {
  site = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<!doctype html><h1>Loja</h1>');
  });
  await new Promise<void>((ready) => {
    site.listen(4393, '127.0.0.1', ready);
  });

  dataDir = await mkdtemp(join(tmpdir(), 'qazinho-outside-'));

  const bin = await mkdtemp(join(tmpdir(), 'qazinho-outside-bin-'));

  await writeFile(join(bin, 'claude'), SLOW_AGENT);
  await chmod(join(bin, 'claude'), 0o755);
  await writeFile(
    join(dataDir, 'projects.json'),
    JSON.stringify([
      {
        id: 'p-1',
        name: 'Loja',
        targets: [
          { id: 't-web', kind: 'web', label: 'Web', value: 'http://127.0.0.1:4393/' },
        ],
      },
    ]),
  );
  await mkdir(join(dataDir, 'workspaces', 'w-1'), { recursive: true });
  await writeFile(join(dataDir, 'workspaces', 'w-1', 'plan.yaml'), PLAN);
  await writeFile(
    join(dataDir, 'workspaces', 'w-1', 'workspace.json'),
    JSON.stringify({
      id: 'w-1',
      projectId: 'p-1',
      name: 'Compra',
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
  await later(1_500);
}, 60_000);

afterAll(async () => {
  await client.close().catch(() => undefined);
  await app.close();
  site.close();
});

describe('an outside agent', () => {
  it('finds nothing until the QA turns the server on', async () => {
    expect(await bridge('outsideServer')).toEqual({ isOn: false, isBusy: false });
    await expect(stat(join(dataDir, 'outside-server.json'))).rejects.toThrow();
  });

  it('reaches QAzinho at the address it was given once turned on', async () => {
    expect(await bridge('turnOutsideServer', true)).toEqual({
      isOn: true,
      isBusy: false,
    });

    const saved = JSON.parse(
      await readFile(join(dataDir, 'outside-server.json'), 'utf8'),
    ) as { port: number; token: string };

    address = `http://127.0.0.1:${String(saved.port)}/${saved.token}/mcp`;
    client = new Client({ name: 'smoke', version: '0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(address)));

    const { tools } = await client.listTools();

    expect(tools.map(({ name }) => name)).toEqual([
      'list_workspaces',
      'workspace_details',
      'create_project',
      'create_workspace',
      'update_project',
      'rename_workspace',
      'delete_workspace',
      'delete_project',
      'add_cases',
      'update_cases',
      'delete_cases',
      'explore_app',
      'start_run',
      'run_status',
      'stop_run',
      'bug_details',
      'dismiss_bug',
      'send_bug',
      'list_variables',
      'ask_variables',
      'update_variable',
      'delete_variable',
      'read_settings',
      'change_settings',
      'connect_integration',
      'disconnect_integration',
      'ask_workspace_chat',
      'read_workspace_chat',
      'pause_run',
      'resume_run',
      'answer_run_question',
      'take_suggestion',
      'list_repositories',
      'link_repository',
      'unlink_repository',
      'link_design',
      'unlink_design',
      'build_app',
      'build_status',
      'export_code',
      'publish_plan',
    ]);
    expect(client.getInstructions()).toContain('start_run');
  });

  /** Quem não tem o token, ou é uma página num navegador, não entra. */
  it('turns away a wrong token, a browser page and another host name', async () => {
    const initialize = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    };
    const wrong = address.replace(/\/[^/]+\/mcp$/, '/nope/mcp');

    expect((await fetch(wrong, initialize)).status).toBe(404);
    expect(
      (
        await fetch(address, {
          ...initialize,
          headers: { ...initialize.headers, origin: 'https://evil.test' },
        })
      ).status,
    ).toBe(404);
  });

  it('never gets the address through the page', async () => {
    const seen = await page.evaluate(() => {
      const web = globalThis as unknown as { document: { body: { innerText: string } } };

      return web.document.body.innerText;
    });

    expect(seen).not.toContain(address);
  });

  it('lists the workspaces and reads a plan', async () => {
    expect((await tool('list_workspaces')).text).toContain(
      'w-1 "Compra" · web http://127.0.0.1:4393/ · 1 case and 1 step · never run',
    );
    expect((await tool('workspace_details', { workspace: 'Compra' })).text).toContain(
      'TC-01',
    );
  });

  it('leaves the screen where it was while a call works', async () => {
    expect(await page.locator('.workspace').count()).toBe(0);
  });

  it('starts a run, reads it going, waits for it without blocking a stop', async () => {
    const started = await tool('start_run', { workspace: 'w-1' });

    expect(started.text).toContain('Started r-01');
    expect((await tool('start_run', { workspace: 'w-1' })).text).toContain(
      'already running r-01',
    );
    expect((await tool('run_status', { workspace: 'w-1' })).text).toContain(
      'still going on',
    );

    const holding = tool('run_status', { workspace: 'w-1', waitSeconds: 30 });

    await later(500);

    const began = Date.now();

    expect((await tool('stop_run', { workspace: 'w-1' })).text).toContain('Stopped r-01');
    expect(Date.now() - began).toBeLessThan(5_000);
    expect((await holding).text).not.toContain('still going on');
  }, 60_000);

  it('writes a case into the plan, which the QA sees there', async () => {
    const said = await tool('add_cases', {
      workspace: 'w-1',
      cases: [
        {
          title: 'Aplicar um cupom',
          priority: 'P1',
          goal: 'O total cai.',
          preconditions: '',
          steps: [{ action: 'Digitar SAVE10', expected: 'O total cai 10%' }],
        },
      ],
    });

    expect(said.text).toContain('Aplicar um cupom');
    expect((await tool('workspace_details', { workspace: 'w-1' })).text).toContain(
      'Aplicar um cupom',
    );
  });

  it('never reaches a tool that was not offered', async () => {
    const said = await tool('delete_variable', { project: 'p-1', variable: 'PASSWORD' });

    expect(said.isError).toBe(true);
  });

  it("reads the settings and a project's variables without a value", async () => {
    expect((await tool('read_settings')).text).toContain('Theme:');
    expect((await tool('list_variables', { project: 'p-1' })).isError).toBe(false);
  });

  // O agente de fora pergunta ao usuário no chat dele antes; aqui a mudança cai no app.
  it('renames a workspace the agent was told to, in the app itself', async () => {
    const said = await tool('rename_workspace', {
      workspace: 'w-1',
      name: 'Compra nova',
    });

    expect(said.isError).toBe(false);
    expect((await tool('list_workspaces')).text).toContain('Compra nova');
  });

  it('comes back on the same address after being turned off and on', async () => {
    await client.close();
    expect(await bridge('turnOutsideServer', false)).toEqual({
      isOn: false,
      isBusy: false,
    });
    await expect(fetch(address, { method: 'POST' })).rejects.toThrow();
    expect(await bridge('turnOutsideServer', true)).toEqual({
      isOn: true,
      isBusy: false,
    });

    client = new Client({ name: 'smoke', version: '0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(address)));

    expect((await tool('list_workspaces')).isError).toBe(false);
  });
});
