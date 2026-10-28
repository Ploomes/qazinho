import type { INetworkEntry } from '@/shared/types';
import type { ServerResponse } from 'node:http';
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { Archive } from '@/main/classes/storage/Archive';
import { Harness, McpHost } from '@salve-software/qazinho-harness';

const PORT = 4357;
const EMAIL = 'buyer@shop.test';
const TOKEN = 'abc12345';

/**
 * Um pedido que a loja nunca responde, como um long poll ainda aberto quando a run
 * termina.
 */
const waiting: ServerResponse[] = [];

/**
 * A loja carrega um perfil pelo e-mail do comprador com um token no endereço, falha um
 * pagamento, perde uma imagem e mantém uma chamada aberta: todo jeito como um pedido pode
 * terminar, no Chrome real.
 */
const server = createServer((request, response) => {
  const path = (request.url ?? '/').split('?')[0];

  if (path === '/api/profile') {
    setTimeout(() => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ name: 'Buyer' }));
    }, 50);

    return;
  }

  if (path === '/api/pay') {
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: `down for ${EMAIL}`, sessionToken: TOKEN }));

    return;
  }

  if (path === '/api/updates') {
    waiting.push(response);

    return;
  }

  if (path === '/missing.png') {
    response.writeHead(404).end();

    return;
  }

  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(`<!doctype html><html><body>
    <label>Email <input id="email" type="email"></label>
    <button onclick="
      const email = document.getElementById('email').value;
      fetch('/api/profile?email=' + encodeURIComponent(email) + '&token=${TOKEN}')
        .then((answer) => answer.json())
        .then((profile) => { document.getElementById('out').textContent = 'Hello, ' + profile.name; });
      fetch('/api/pay', { method: 'POST' });
      fetch('/api/updates');
    ">Load profile</button>
    <p id="out">Nobody</p>
    <img src="/missing.png" alt="">
  </body></html>`);
});

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
 * Digita o e-mail do comprador como a variável que ele é, carrega o perfil, e passa
 * quando ele aparece.
 */
const AGENT = `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
process.stdin.on('data', () => undefined);
process.stdin.on('end', async () => {
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  await client.callTool({ name: 'fill', arguments: { target: 'Email', value: '\${SHOP_EMAIL}' } });
  await client.callTool({ name: 'click', arguments: { target: 'Load profile' } });
  await new Promise((later) => setTimeout(later, 800));
  await client.callTool({ name: 'report', arguments: {
    step: 1, verdict: 'passed', why: 'The profile loaded.', got: 'Hello, Buyer', proof: 'Hello, Buyer',
  } });
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.01 }));
});
`;

let root = '';
let entries: INetworkEntry[] = [];

const find = (props: { path: string; method?: string }) =>
  entries.find(
    ({ url, method }) =>
      new URL(url).pathname === props.path && method === (props.method ?? 'GET'),
  );

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-network-'));
  await mkdir(join(root, 'workspaces', 'w-network'), { recursive: true });

  const agent = join(root, 'agent');

  await writeFile(agent, AGENT);
  await chmod(agent, 0o755);

  const tools = new McpHost();

  await tools.start();

  const coordinator = new RunCoordinator({
    runner: new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    }),
    findAndroid: async () => null,
    findIos: async () => null,
    findCommand: async () => agent,
    live: new LiveStream(),
    tools,
    harness: new Harness(),
    dataRoot: root,
    variablesOf: async () => [
      { name: 'SHOP_EMAIL', description: 'The buyer on staging', value: EMAIL },
    ],
    onEvent: () => undefined,
  });

  await coordinator.start({
    workspaceId: 'w-network',
    projectId: 'p-shop',
    agentId: 'fake',
    model: '',
    target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
    runId: 'r-01',
    language: 'en',
    steps: [
      {
        caseId: 'TC-01',
        caseTitle: 'The profile loads',
        casePriority: 'P1',
        caseGoal: '',
        casePreconditions: '',
        numberInCase: 1,
        action: 'Load the profile of ${SHOP_EMAIL}',
        expected: 'The page greets the buyer',
      },
    ],
  });

  entries =
    (await new Archive(root).readNetwork({ workspaceId: 'w-network', runId: 'r-01' })) ??
    [];
}, 120_000);

afterAll(() => {
  for (const response of waiting) response.destroy();

  server.closeAllConnections();
  server.close();
});

describe("a web run's network", () => {
  it('keeps the page and each call it made, with the status each came back with', () => {
    expect(find({ path: '/' })).toMatchObject({ type: 'document', status: 200 });
    expect(find({ path: '/api/profile' })).toMatchObject({ type: 'fetch', status: 200 });
    expect(find({ path: '/api/pay', method: 'POST' })).toMatchObject({ status: 500 });
    expect(find({ path: '/missing.png' })).toMatchObject({ type: 'image', status: 404 });
  });

  /**
   * O tamanho é o corpo como cruzou a rede: este veio em chunks, então pesa um pouco
   * mais.
   */
  it('times each call, and sizes the answer of a call or a page', () => {
    const profile = find({ path: '/api/profile' });

    expect(profile?.durationMs).toBeGreaterThanOrEqual(40);
    expect(profile?.size).toBeGreaterThanOrEqual(
      JSON.stringify({ name: 'Buyer' }).length,
    );
    expect(find({ path: '/missing.png' })?.size).toBeNull();
  });

  it('keeps a call still open when the run ended with no end and no status', () => {
    expect(find({ path: '/api/updates' })).toMatchObject({
      durationMs: null,
      status: null,
    });
  });

  it("writes a variable's value in an address as its name, and hides a token", () => {
    const kept = JSON.stringify(entries);

    expect(find({ path: '/api/profile' })?.url).toBe(
      `http://127.0.0.1:${String(PORT)}/api/profile?email=\${SHOP_EMAIL}&token=•••`,
    );
    expect(kept).not.toContain(EMAIL);
    expect(kept).not.toContain(encodeURIComponent(EMAIL));
    expect(kept).not.toContain(TOKEN);
  });

  it('keeps what a failed call answered, its values as their names and its secrets as dots', () => {
    expect(JSON.parse(find({ path: '/api/pay', method: 'POST' })?.body ?? '{}')).toEqual({
      error: 'down for ${SHOP_EMAIL}',
      sessionToken: '•••',
    });
    expect(find({ path: '/api/profile' })).not.toHaveProperty('body');
  });

  it('notes the requests in the order they started', () => {
    const starts = entries.map(({ startedAt }) => startedAt);

    expect(starts).toEqual([...starts].sort((one, other) => one - other));
    expect(entries.map(({ id }) => id)).toEqual(entries.map((_, index) => index + 1));
  });
});
