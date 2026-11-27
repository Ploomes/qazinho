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
import { Harness, McpHost } from '@ploomes/qazinho-harness';

const PORT = 4353;
const EMAIL = 'buyer@shop.test';

/**
 * `$&` e `$1` significam algo para um replace de string, e um espaço para um shell: o
 * campo precisa recebê-los como digitados.
 */
const PASSWORD = 'Sup3r $& $1 s3cret';

/**
 * A loja só deixa o comprador entrar com a senha digitada exatamente, e o cumprimenta
 * pelo e-mail.
 */
const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(`<!doctype html><html><body>
    <label>Email <input id="email" type="email"></label>
    <label>Password <input id="password" type="password"></label>
    <button onclick="
      const email = document.getElementById('email').value;
      const isRight = document.getElementById('password').value === ${JSON.stringify(PASSWORD).replace(/"/g, '&quot;')};
      document.getElementById('out').textContent = isRight ? 'Welcome, ' + email : 'Wrong password';
    ">Sign in</button>
    <p id="out">Signed out</p>
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
 * Entra do jeito que o Claude Code entraria, digitando as variáveis como o passo as
 * nomeia, e anota tudo o que o QAzinho lhe disse: o caso que recebeu e a resposta de cada
 * ferramenta.
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
  const call = async (name, args) => {
    const answer = await client.callTool({ name, arguments: args });
    const text = answer.content[0].text;
    hear(text);
    return text;
  };
  await call('fill', { target: 'Email', value: '\${SHOP_EMAIL}' });
  await call('fill', { target: 'Password', value: '\${SHOP_PASSWORD}' });
  const saw = await call('click', { target: 'Sign in' });
  const said = saw.split('\\n').find((line) => line.startsWith('Welcome') || line.startsWith('Wrong')) ?? '';
  await call('report', {
    step: 1, verdict: said.startsWith('Welcome') ? 'passed' : 'failed', why: 'The shop answered.', got: said, proof: said,
  });
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.01 }));
});
`;

let root = '';
let heard = '';
let coordinator: RunCoordinator;
let events: IRunEvent[] = [];

async function run(runId: string) {
  events = [];

  await coordinator.start({
    workspaceId: 'w-variables',
    projectId: 'p-shop',
    agentId: 'fake',
    model: '',
    target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
    runId,
    language: 'en',
    steps: [
      {
        caseId: 'TC-01',
        caseTitle: 'Sign in',
        casePriority: 'P1',
        caseGoal: '',
        casePreconditions: '',
        numberInCase: 1,
        action: 'Sign in with ${SHOP_EMAIL} and ${SHOP_PASSWORD}',
        expected: 'The shop greets the buyer',
      },
    ],
  });

  return events.flatMap((event) =>
    event.kind === 'step'
      ? [`${event.outcome.verdict} ${event.outcome.by ?? 'agent'} ${event.outcome.got}`]
      : [],
  );
}

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-variables-'));
  heard = join(root, 'heard.log');
  await mkdir(join(root, 'workspaces', 'w-variables'), { recursive: true });

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
    variablesOf: async (projectId) =>
      projectId === 'p-shop'
        ? [
            { name: 'SHOP_EMAIL', description: 'The buyer on staging', value: EMAIL },
            { name: 'SHOP_PASSWORD', description: 'Its password', value: PASSWORD },
          ]
        : [],
    onEvent: (event) => {
      events.push(event);
    },
  });
});

afterAll(() => {
  server.close();
});

describe("a project's variables in a run", () => {
  it('types each value into the page while the agent only ever reads its name', async () => {
    expect(await run('r-01')).toEqual(['passed agent Welcome, ${SHOP_EMAIL}']);

    const told = await readFile(heard, 'utf8');

    expect(told).toContain('- ${SHOP_EMAIL}: The buyer on staging');
    expect(told).toContain('Welcome, ${SHOP_EMAIL}');
    expect(told).not.toContain(EMAIL);
    expect(told).not.toContain('s3cret');
  }, 120_000);

  it('keeps the recipe with the names, never the values', async () => {
    const book = await readFile(
      join(root, 'workspaces', 'w-variables', 'recipes.json'),
      'utf8',
    );

    expect(book).toContain('${SHOP_PASSWORD}');
    expect(book).not.toContain(EMAIL);
    expect(book).not.toContain('s3cret');
  });

  it('walks it again without the agent, typing the values and checking the proof', async () => {
    expect(await run('r-02')).toEqual(['passed replay Welcome, ${SHOP_EMAIL}']);
  }, 120_000);
});
