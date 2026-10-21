import type { IRunEvent, IStepOutcome } from '@/shared/types';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PORT = 4352;

/** The page a button signs in on; `greeting` changes what it says, the way a new build would. */
let greeting = 'Signed in';

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(`<!doctype html><html><body>
    <button onclick="document.getElementById('out').textContent='${greeting}'">Sign in</button>
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
 * Walks the case the way Claude Code does, and writes down each time it is asked: a run that
 * walks a recipe again must not ask it at all. It proves the step with what the page then says.
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
  const clicked = await client.callTool({ name: 'click', arguments: { target: 'Sign in' } });
  const saw = clicked.content[0].text;
  const said = saw.includes('Welcome back') ? 'Welcome back' : 'Signed in';
  await client.callTool({ name: 'report', arguments: {
    step: 1, verdict: 'passed', why: 'The page greets me.', got: said, proof: said,
  } });
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.01 }));
});
`;

let root = '';
let calls = '';
let coordinator: RunCoordinator;
let events: IRunEvent[] = [];

/** One run of a one-step plan; what it reported, and how many times the agent was asked so far. */
async function run(props: { runId: string; mode?: 'replay' | 'agent' }) {
  events = [];

  await coordinator.start({
    workspaceId: 'w-replay',
    agentId: 'fake',
    model: '',
    target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
    runId: props.runId,
    language: 'en',
    ...(props.mode === undefined ? {} : { mode: props.mode }),
    steps: [
      {
        caseId: 'TC-01',
        caseTitle: 'Sign in',
        casePriority: 'P1',
        caseGoal: '',
        casePreconditions: '',
        numberInCase: 1,
        action: 'Click Sign in',
        expected: 'The page greets the QA',
      },
    ],
  });

  const outcomes = events.flatMap((event) =>
    event.kind === 'step' ? [event.outcome] : [],
  );
  const asked = (await readFile(calls, 'utf8').catch(() => ''))
    .split('\n')
    .filter(Boolean).length;

  return {
    outcomes,
    asked,
    cost: events.some((event) => event.kind === 'cost'),
  };
}

const verdicts = (outcomes: IStepOutcome[]) =>
  outcomes.map(({ verdict, by, got }) => `${verdict} ${by ?? 'agent'} ${got}`);

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-replay-'));
  calls = join(root, 'calls.log');
  await mkdir(join(root, 'workspaces', 'w-replay'), { recursive: true });

  const agent = join(root, 'agent');

  await writeFile(agent, agentScript(calls));
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

describe('a case walked again without the agent', () => {
  it('records the case the first time, with the words that proved it', async () => {
    const first = await run({ runId: 'r-01' });

    expect(verdicts(first.outcomes)).toEqual(['passed agent Signed in']);
    expect(first.asked).toBe(1);

    const book = JSON.parse(
      await readFile(join(root, 'workspaces', 'w-replay', 'recipes.json'), 'utf8'),
    ) as {
      cases: {
        caseId: string;
        steps: { actions: { kind: string }[]; proof: string }[];
      }[];
    };

    expect(book.cases[0]).toMatchObject({
      caseId: 'TC-01',
      steps: [{ actions: [{ kind: 'click' }], proof: 'Signed in' }],
    });
  }, 120_000);

  it('walks it again without asking the agent, and costs nothing', async () => {
    const again = await run({ runId: 'r-02' });

    expect(verdicts(again.outcomes)).toEqual(['passed replay Signed in']);
    expect(again.asked).toBe(1);
    expect(again.cost).toBe(false);
  }, 120_000);

  it('hands the case back to the agent once the app changed, and keeps what it found', async () => {
    greeting = 'Welcome back';

    const healed = await run({ runId: 'r-03' });

    expect(verdicts(healed.outcomes)).toEqual(['passed healed Welcome back']);
    expect(healed.asked).toBe(2);

    const next = await run({ runId: 'r-04' });

    expect(verdicts(next.outcomes)).toEqual(['passed replay Welcome back']);
    expect(next.asked).toBe(2);
  }, 180_000);

  it('asks the agent for every case when the QA runs with the agent', async () => {
    const forced = await run({ runId: 'r-05', mode: 'agent' });

    expect(verdicts(forced.outcomes)).toEqual(['passed agent Welcome back']);
    expect(forced.asked).toBe(3);
  }, 120_000);
});
