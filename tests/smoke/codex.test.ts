import type { IRunEvent } from '@/shared/types';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { agentFailure } from '@/main/library';

/**
 * A Codex that speaks `codex exec --json` the way the real one does: thread.started, items, and
 * turn.completed or turn.failed. The signed-out lines are the ones a real signed-out Codex
 * printed; the rest follows Codex's documented events, since no signed-in Codex was at hand.
 */
const PORT = 4327;
const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

const PAGE = `<!doctype html><html><body>
  <button onclick="document.getElementById('out').textContent='Signed in'">Sign in</button>
  <p id="out">Signed out</p>
</body></html>`;

function fakeCodex(root: string) {
  return `#!/usr/bin/env node
const fs = require('node:fs');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(join(root, 'calls'))}, JSON.stringify(argv) + '\\n');
const say = (event) => console.log(JSON.stringify(event));
const config = (key) => {
  const found = argv.find((one) => one.startsWith(key + '='));
  return found === undefined ? null : JSON.parse(found.slice(key.length + 1));
};
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  if (fs.existsSync(${JSON.stringify(join(root, 'signed-out'))})) {
    say({ type: 'thread.started', thread_id: 'thread-x' });
    say({ type: 'turn.started' });
    say({ type: 'error', message: 'Reconnecting... 2/5 (unexpected status 401 Unauthorized: Missing bearer or basic authentication in header)' });
    say({ type: 'turn.failed', error: { message: 'unexpected status 401 Unauthorized: Missing bearer or basic authentication in header' } });
    process.exit(1);
  }
  const resumed = argv[1] === 'resume' ? argv[2] : null;
  say({ type: 'thread.started', thread_id: resumed ?? 'thread-1' });
  say({ type: 'turn.started' });
  const schemaAt = argv.indexOf('--output-schema');
  const url = config('mcp_servers.qazinho.url');
  if (url !== null) {
    const client = new Client({ name: 'fake-codex', version: '1.0.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(url)));
    const clicked = await client.callTool({ name: 'click', arguments: { target: 'Sign in' } });
    const saw = clicked.content[0].text;
    await client.callTool({ name: 'report', arguments: {
      step: 1, verdict: saw.includes('Signed in') ? 'passed' : 'failed', why: 'The page says Signed in.', got: saw.slice(0, 60),
    } });
    await client.close();
    say({ type: 'item.completed', item: { id: 'item_1', type: 'agent_message', text: 'Case done.' } });
  } else if (schemaAt !== -1) {
    const schema = JSON.parse(fs.readFileSync(argv[schemaAt + 1], 'utf8'));
    const strict = schema.required.includes('plan') && schema.additionalProperties === false;
    const briefed = (config('developer_instructions') ?? '').includes('## Talking with the QA');
    say({ type: 'item.completed', item: { id: 'item_0', type: 'reasoning', text: 'thinking' } });
    say({ type: 'item.completed', item: { id: 'item_1', type: 'agent_message', text: JSON.stringify({
      reply: strict && briefed ? 'Hi, ' + prompt.trim() : 'not strict or not briefed',
      plan: null,
    }) } });
  }
  say({ type: 'turn.completed', usage: { input_tokens: 1500, cached_input_tokens: 900, output_tokens: 30 } });
});
`;
}

let root: string;
let codex: string;
const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});

const runner = () =>
  new AgentRunner({ owners: new ProcessOwners(), onEvent: () => undefined });
const calls = async () =>
  (await readFile(join(root, 'calls'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as string[]);

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'qazinho-codex-'));
  codex = join(root, 'codex');
  await writeFile(codex, fakeCodex(root));
  await chmod(codex, 0o755);
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
});

afterAll(() => {
  site.close();
});

describe('Codex in the chat', () => {
  it('answers in the strict schema, briefed by the harness, and resumes the same thread', async () => {
    const harness = new Harness();
    const chat = harness.chat({
      target: null,
      viewport: null,
      steps: [],
      references: [],
      look: null,
    });
    const ask = (sessionId: string | null) =>
      runner().ask({
        workspaceId: 'w-codex',
        agentId: 'codex',
        command: codex,
        model: '',
        sessionId,
        prompt: 'QA here',
        schema: chat.schema,
        systemPrompt: chat.systemPrompt,
        allowedTools: chat.tools.allowedTools,
      });

    const first = await ask(null);

    expect(first.isError).toBe(false);
    expect(first.sessionId).toBe('thread-1');
    expect(harness.readChat(first.text)).toEqual({
      reply: 'Hi, QA here',
      questions: [],
      plan: null,
    });
    expect(first.usage?.contextTokens).toBe(1500);

    await ask(first.sessionId);

    expect((await calls()).at(-1)?.slice(0, 3)).toEqual(['exec', 'resume', 'thread-1']);
  });

  it('reads a signed-out Codex as signed out, for the page to say how to sign it in', async () => {
    await writeFile(join(root, 'signed-out'), '');

    const turn = await runner().ask({
      workspaceId: 'w-codex',
      agentId: 'codex',
      command: codex,
      model: '',
      sessionId: null,
      prompt: 'hi',
    });

    await rm(join(root, 'signed-out'));

    expect(turn.isError).toBe(true);
    expect(agentFailure(turn)).toEqual({ reason: 'agent-signed-out' });
  });
});

describe('Codex on a run', () => {
  it("drives the device through QAzinho's MCP server and reports the step", async () => {
    const events: IRunEvent[] = [];
    const tools = new McpHost();

    await tools.start();
    await new RunCoordinator({
      runner: runner(),
      findAndroid: async () => null,
      findIos: async () => null,
      findCommand: async () => codex,
      live: new LiveStream(),
      tools,
      harness: new Harness(),
      dataRoot: root,
      onEvent: (event) => events.push(event),
    }).start({
      workspaceId: 'w-codex-run',
      agentId: 'codex',
      model: '',
      target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
      runId: 'r-01',
      language: 'en',
      steps: [
        {
          caseId: 'TC-01',
          caseTitle: 'Sign in',
          casePriority: 'P1',
          caseGoal: '',
          casePreconditions: '',
          numberInCase: 1,
          action: 'Click Sign in',
          expected: 'The page says Signed in',
        },
      ],
    });
    tools.close();

    const step = events.find((event) => event.kind === 'step');

    expect(step?.kind === 'step' && step.outcome.verdict).toBe('passed');
    expect(events.at(-1)).toEqual({ kind: 'done', workspaceId: 'w-codex-run' });
  }, 60_000);
});
