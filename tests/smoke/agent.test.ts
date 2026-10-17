import type { IRunEvent } from '@/shared/types';
import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { DeviceToolServer } from '@/main/classes/agents/DeviceToolServer';
import { Harness } from '@/main/classes/agents/Harness';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PORT = 4325;

const PAGE = `<!doctype html><html><body>
  <button onclick="document.getElementById('out').textContent='Signed in'">Sign in</button>
  <p id="out">Signed out</p>
</body></html>`;

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

// Works the way Claude Code does with --mcp-config: it calls the device tools, sees each result,
// and reports the step through the report tool.
const RESOURCEFUL = `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
process.stdin.resume();
process.stdin.on('end', async () => {
  const harnessed = argv.includes('--append-system-prompt') && argv.includes('--strict-mcp-config');
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const first = await client.callTool({ name: 'click', arguments: { target: 'Log in' } });
  const second = first.isError ? await client.callTool({ name: 'click', arguments: { target: 'Sign in' } }) : first;
  const saw = second.content[0].text;
  await client.callTool({ name: 'report', arguments: {
    step: 1,
    verdict: harnessed && saw.includes('Signed in') ? 'passed' : 'failed',
    why: 'The page says Signed in.',
    got: saw.slice(0, 80),
    ...(first.isError ? { note: 'There is no Log in button, so I used Sign in.' } : {}),
  } });
  await client.close();
  console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1' }));
});
`;

const BROKEN = `#!/usr/bin/env node
process.stdin.resume();
process.stdin.on('end', () => {
  console.log(JSON.stringify({ type: 'result', result: 'API Error: 400 model: String should have at least 1 character', is_error: true }));
  process.exit(1);
});
`;

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(PAGE);
});

async function walkWith(script: string): Promise<IRunEvent[]> {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-agent-'));
  const agent = join(root, 'agent');

  await writeFile(agent, script);
  await chmod(agent, 0o755);

  const events: IRunEvent[] = [];
  const deviceTools = new DeviceToolServer();

  await deviceTools.start();

  const coordinator = new RunCoordinator({
    runner: new AgentRunner({ owners: new ProcessOwners(), onEvent: () => undefined }),
    findAndroid: async () => null,
    findIos: async () => null,
    findCommand: async () => agent,
    live: new LiveStream(),
    tools: deviceTools,
    harness: new Harness(),
    dataRoot: root,
    onEvent: (event) => events.push(event),
  });

  await coordinator.start({
    workspaceId: 'w-agent',
    agentId: 'fake',
    model: '',
    target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
    runId: 'r-01',
    steps: [
      {
        caseId: 'TC-01',
        caseTitle: 'Sign in',
        numberInCase: 1,
        action: 'Click the Log in button',
        expected: 'The page says Signed in',
      },
    ],
  });

  return events;
}

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
});

afterAll(() => {
  server.close();
});

describe('an agent on a real browser', () => {
  it('acts through the device tools, works around a failed one, and tells the QA', async () => {
    const events = await walkWith(RESOURCEFUL);
    const step = events.find((event) => event.kind === 'step');

    expect(events).toContainEqual({
      kind: 'note',
      workspaceId: 'w-agent',
      text: 'There is no Log in button, so I used Sign in.',
    });
    expect(step?.kind === 'step' && step.outcome.verdict).toBe('passed');
    expect(events.at(-1)).toEqual({ kind: 'done', workspaceId: 'w-agent' });
  });

  it('stops the run with the agent error instead of blocking every step', async () => {
    const events = await walkWith(BROKEN);

    expect(events.some((event) => event.kind === 'step')).toBe(false);
    expect(events.at(-1)).toMatchObject({
      kind: 'failed',
      text: expect.stringContaining('API Error: 400') as string,
    });
  });
});
