import type { IManualTurn, IRunEvent, IStepOutcome } from '@/shared/types';
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

const PORT = 4353;

/**
 * Uma página que só mostra o pedido depois de entrar, com um botão e um campo em lugares
 * fixos, para o teste tocar neles por frações da janela de 1280 por 800. Cada clique e
 * cada texto digitado chega ao servidor, que é como o teste sabe o que a página recebeu.
 */
const PAGE = `<!doctype html><html><body style="margin:0">
  <button id="in" style="position:absolute;left:0;top:0;width:200px;height:80px"
    onclick="document.getElementById('order').hidden=false">Sign in</button>
  <div id="order" hidden>
    <p style="position:absolute;left:0;top:100px">Order 1042</p>
    <button style="position:absolute;left:0;top:200px;width:200px;height:80px"
      onclick="fetch('/clicked')">Download the invoice</button>
    <input style="position:absolute;left:0;top:400px;width:400px;height:60px"
      oninput="fetch('/typed?value=' + encodeURIComponent(this.value))">
  </div>
</body></html>`;

const heard: string[] = [];

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${String(PORT)}`);

  if (url.pathname === '/clicked') heard.push('clicked');

  if (url.pathname === '/typed')
    heard.push(`typed ${url.searchParams.get('value') ?? ''}`);

  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(url.pathname === '/' ? PAGE : '');
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
 * Prepara o caso do jeito que o Claude Code prepara, e anota cada vez que é perguntado:
 * entra, e relata o passo 1, o preparo, com o que a página mostra depois.
 */
const agentScript = (calls: string) => `#!/usr/bin/env node
const fs = require('fs');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
fs.appendFileSync(${JSON.stringify(calls)}, 'asked\\n');
process.stdin.resume();
process.stdin.on('end', async () => {
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  await client.callTool({ name: 'click', arguments: { target: 'Sign in' } });
  await client.callTool({ name: 'report', arguments: {
    step: 1, verdict: 'passed', why: 'Signed in, on the order.', got: 'Order 1042', proof: 'Order 1042',
  } });
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.01 }));
});
`;

const STEPS = [
  {
    caseId: 'TC-07',
    caseTitle: 'The invoice downloads',
    casePriority: 'P2',
    caseGoal: '',
    casePreconditions: 'Signed in, on order 1042',
    numberInCase: 1,
    action: 'Download the invoice',
    expected: 'A PDF downloads',
    caseIsManual: true,
  },
  {
    caseId: 'TC-07',
    caseTitle: 'The invoice downloads',
    casePriority: 'P2',
    caseGoal: '',
    casePreconditions: 'Signed in, on order 1042',
    numberInCase: 2,
    action: 'Type the e-mail to send it to',
    expected: 'The e-mail shows in the field',
    caseIsManual: true,
  },
];

let root = '';
let calls = '';
let coordinator: RunCoordinator;
let events: IRunEvent[] = [];

/** Espera um evento da run, ou falha depois de um tempo. */
async function waitFor<T>(find: () => T | undefined, ms = 60_000): Promise<T> {
  const until = Date.now() + ms;

  while (Date.now() < until) {
    const found = find();

    if (found !== undefined) return found;

    await new Promise((wake) => setTimeout(wake, 100));
  }

  throw new Error('The run never got there.');
}

const turnOf = () =>
  waitFor(
    () =>
      events.flatMap((event): IManualTurn[] =>
        event.kind === 'manual' ? [event.turn] : [],
      )[0],
  );

const outcomesOf = (): IStepOutcome[] =>
  events.flatMap((event) => (event.kind === 'step' ? [event.outcome] : []));

const asked = async () =>
  (await readFile(calls, 'utf8').catch(() => '')).split('\n').filter(Boolean).length;

function start(props: { runId: string; mode: 'manual' | 'replay' }) {
  events = [];

  return coordinator.start({
    workspaceId: 'w-manual',
    projectId: 'p-1',
    agentId: 'fake',
    model: '',
    target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
    runId: props.runId,
    language: 'en',
    mode: props.mode,
    caseIds: ['TC-07'],
    steps: STEPS,
  });
}

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-manual-'));
  calls = join(root, 'calls.log');
  await mkdir(join(root, 'workspaces', 'w-manual'), { recursive: true });

  const agent = join(root, 'agent');

  await writeFile(agent, agentScript(calls));
  await chmod(agent, 0o755);

  const tools = new McpHost();
  const live = new LiveStream();

  await tools.start();
  await live.start();
  coordinator = new RunCoordinator({
    runner: new AgentRunner({
      owners: new ProcessOwners(),
      folder: tmpdir(),
      onEvent: () => undefined,
    }),
    findAndroid: async () => null,
    findIos: async () => null,
    findCommand: async () => agent,
    live,
    tools,
    harness: new Harness(),
    dataRoot: root,
    variablesOf: async () => [
      { name: 'SEND_TO', description: 'Where invoices go', value: 'qa@shop.test' },
    ],
    onEvent: (event) => {
      events.push(event);
    },
  });
});

afterAll(() => {
  server.close();
});

describe('a case the QA walks by hand', () => {
  it('has the agent prepare it, then takes the QA’s clicks, words and marks as the steps', async () => {
    const running = start({ runId: 'r-01', mode: 'manual' });
    const turn = await turnOf();

    expect(turn).toEqual({ caseId: 'TC-07', prep: 'agent' });
    expect(await asked()).toBe(1);

    await coordinator.touch({
      workspaceId: 'w-manual',
      input: { kind: 'tap', x: 100 / 1280, y: 240 / 800 },
    });
    await waitFor(() => (heard.includes('clicked') ? true : undefined));
    await coordinator.mark({ workspaceId: 'w-manual', verdict: 'passed', note: '' });
    await coordinator.touch({
      workspaceId: 'w-manual',
      input: { kind: 'tap', x: 100 / 1280, y: 430 / 800 },
    });

    expect(
      await coordinator.typeVariable({ workspaceId: 'w-manual', name: 'SEND_TO' }),
    ).toBe(true);

    await waitFor(() => (heard.includes('typed qa@shop.test') ? true : undefined));
    await coordinator.mark({
      workspaceId: 'w-manual',
      verdict: 'failed',
      note: 'The field cuts qa@shop.test after the at sign',
    });
    await running;

    const [first, second] = outcomesOf();

    expect(first).toMatchObject({ stepNumber: 1, verdict: 'passed', by: 'qa' });
    expect(first?.shotFile).toMatch(/step-1\.jpg$/);
    expect(second).toMatchObject({
      stepNumber: 2,
      verdict: 'failed',
      by: 'qa',
      title: 'The field cuts ${SEND_TO} after the at sign',
    });
    expect(events.some((event) => event.kind === 'done')).toBe(true);

    const book = JSON.parse(
      await readFile(join(root, 'workspaces', 'w-manual', 'recipes.json'), 'utf8'),
    ) as { cases: unknown[]; preps?: { caseId: string; steps: { proof: string }[] }[] };

    expect(book.cases).toEqual([]);
    expect(book.preps?.[0]).toMatchObject({
      caseId: 'TC-07',
      steps: [{ proof: 'Order 1042' }],
    });
  }, 180_000);

  it('prepares it again from the recording, and leaves what the QA did not mark unmarked', async () => {
    const running = start({ runId: 'r-02', mode: 'manual' });

    expect(await turnOf()).toEqual({ caseId: 'TC-07', prep: 'replayed' });
    expect(await asked()).toBe(1);

    coordinator.endManual('w-manual');
    await running;

    expect(
      outcomesOf().map(({ verdict, unwalked }) => `${verdict} ${unwalked ?? ''}`),
    ).toEqual(['skipped ended', 'skipped ended']);
  }, 180_000);

  it('leaves a manual case out of a run of the plan, and asks no agent for it', async () => {
    await start({ runId: 'r-03', mode: 'replay' });

    expect(outcomesOf()).toEqual([]);
    expect(events.some((event) => event.kind === 'manual')).toBe(false);
    expect(await asked()).toBe(1);
  }, 120_000);
});
