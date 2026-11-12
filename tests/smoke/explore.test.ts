import type { IRunEvent } from '@/shared/types';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { Harness, McpHost } from '@salve-software/qazinho-harness';

const PORT = 4354;

/**
 * Uma loja de três páginas: o total do carrinho discorda do único item dele, e a ajuda
 * tem um erro de digitação, para o explorador achar.
 */
const server = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(
    request.url === '/cart'
      ? '<!doctype html><html><body><h1>Cart</h1><p>Shirt R$ 79,90</p><p>Total R$ 0,00</p><a href="/help">Help</a></body></html>'
      : request.url === '/help'
        ? '<!doctype html><html><body><h1>Hepl</h1></body></html>'
        : '<!doctype html><html><body><h1>Shop</h1><a href="/cart">Cart</a></body></html>',
  );
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
 * Explora a loja do jeito que o Claude Code faria: anota a home, abre o carrinho, o
 * anota, registra o total errado e termina com um caso. `pause` o faz enrolar antes do
 * carrinho, para uma exploração curta estourar o tempo sob ele. Anota a resposta de toda
 * ferramenta, e as ferramentas que viu.
 */
const agentScript = (heard: string) => `#!/usr/bin/env node
const fs = require('fs');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  const hear = (text) => fs.appendFileSync(${JSON.stringify(heard)}, text + '\\n');
  hear(prompt);
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  hear('tools: ' + (await client.listTools()).tools.map(({ name }) => name).join(','));
  const call = async (name, args) => {
    const answer = await client.callTool({ name, arguments: args });
    hear(answer.content[0].text);
    return answer.content[0].text;
  };
  await call('screen', { name: 'Shop', about: 'The home, with a link to the cart.' });
  if (!prompt.includes('for 10 minutes')) await new Promise((wake) => setTimeout(wake, 2500));
  await call('click', { target: 'Cart' });
  await call('screen', { name: 'Cart', about: 'What the buyer picked, and the total.' });
  await call('bug', { title: 'Cart total ignores the shirt', severity: 'high', expected: 'Total R$ 79,90', got: 'Total R$ 0,00' });
  await call('click', { target: 'Help' });
  await call('bug', { title: 'Help title is misspelled', severity: 'low', expected: 'Help', got: 'Hepl' });
  const finish = {
    summary: 'Two screens. The cart total is wrong.',
    cases: [{ title: 'Cart total adds the items', priority: 'P1', goal: 'The total is the sum of the items.', preconditions: 'One shirt in the cart.', steps: [{ action: 'Open the cart', expected: 'Total R$ 79,90' }] }],
  };
  const said = await call('finish', finish);
  for (let told = said; told.includes('still left'); ) told = await call('finish', finish);
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.02 }));
});
`;

let root = '';
let heard = '';
let coordinator: RunCoordinator;
let events: IRunEvent[] = [];

async function explore(props: { runId: string; minutes: number }) {
  events = [];

  await coordinator.start({
    workspaceId: 'w-explore',
    agentId: 'fake',
    model: '',
    target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
    runId: props.runId,
    language: 'en',
    mode: 'explore',
    minutes: props.minutes,
    steps: [],
  });

  return events;
}

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-explore-'));
  heard = join(root, 'heard.log');
  await mkdir(join(root, 'workspaces', 'w-explore'), { recursive: true });

  const agent = join(root, 'agent');

  await writeFile(agent, agentScript(heard));
  await chmod(agent, 0o755);

  const tools = new McpHost();

  await tools.start();
  coordinator = new RunCoordinator({
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
    onEvent: (event) => {
      events.push(event);
    },
  });
});

afterAll(() => {
  server.close();
});

describe('an exploration of the app with no plan', () => {
  it('keeps each screen as a step, files what is wrong, and hands over the suggested plan', async () => {
    const seen = await explore({ runId: 'r-01', minutes: 10 });
    const screens = seen.flatMap((event) =>
      event.kind === 'step' ? [`${event.outcome.caseId} ${event.outcome.action}`] : [],
    );
    const findings = seen.filter((event) => event.kind === 'finding');
    const explored = seen.find((event) => event.kind === 'explored');

    /** A ajuda nunca foi anotada: o bug achado nela a anota antes, e cai nela. */
    expect(screens).toEqual(['EX Shop', 'EX Cart', 'EX /help']);
    expect(findings).toMatchObject([
      {
        finding: {
          caseId: 'EX',
          stepNumber: 2,
          action: 'Cart',
          title: 'Cart total ignores the shirt',
        },
      },
      {
        finding: {
          caseId: 'EX',
          stepNumber: 3,
          action: '/help',
          title: 'Help title is misspelled',
        },
      },
    ]);
    expect(explored).toMatchObject({
      summary: 'Two screens. The cart total is wrong.',
      cases: [{ title: 'Cart total adds the items' }],
    });
    expect(seen.at(-1)).toEqual({ kind: 'done', workspaceId: 'w-explore' });

    const told = await readFile(heard, 'utf8');

    expect(told).toContain('Explore the app for 10 minutes');
    expect(told).toMatch(/tools: .*screen.*finish/);
    expect(told).not.toMatch(/tools: .*report/);
    expect(told).toMatch(/Done\..* About (9|10) minutes left\. The device now shows:/);
    expect(told).toMatch(/About (9|10) minutes are still left: use them\./);
  }, 120_000);

  it('does NOT act once the time is up, and still takes the finish', async () => {
    const seen = await explore({ runId: 'r-02', minutes: 1 / 60 });

    expect((await readFile(heard, 'utf8')).split('Explore the app for').at(-1)).toContain(
      'Time is up: call finish now with what you saw.',
    );
    expect(seen.some((event) => event.kind === 'explored')).toBe(true);
  }, 120_000);
});
