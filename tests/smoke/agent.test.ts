import type { IRunEvent } from '@/types';
import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PORT = 4325;

const PAGE = `<!doctype html><html><body>
  <button onclick="document.getElementById('out').textContent='Signed in'">Sign in</button>
  <p id="out">Signed out</p>
</body></html>`;

// Answers the way Claude Code does under --json-schema: a StructuredOutput tool call, then a result.
const RESOURCEFUL = `#!/usr/bin/env node
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', () => {
  const said = (input) => console.log(JSON.stringify({ type: 'assistant', session_id: 's1',
    message: { content: [{ type: 'tool_use', name: 'StructuredOutput', input }] } }));
  if (prompt.includes('You are judging')) said({ verdict: 'passed', why: 'It says Signed in.', got: 'Signed in' });
  else if (prompt.includes('Your last try')) said({ actions: [{ kind: 'click', target: 'Sign in', value: '' }],
    note: 'There is no Log in button, so I used Sign in.' });
  else said({ actions: [{ kind: 'click', target: 'Log in', value: '' }] });
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
  const root = await mkdtemp(join(tmpdir(), 'gocrash-agent-'));
  const agent = join(root, 'agent');

  await writeFile(agent, script);
  await chmod(agent, 0o755);

  const events: IRunEvent[] = [];
  const coordinator = new RunCoordinator({
    runner: new AgentRunner({ owners: new ProcessOwners(), onEvent: () => undefined }),
    findAndroid: async () => null,
    findIos: async () => null,
    findCommand: async () => agent,
    live: new LiveStream(),
    dataRoot: root,
    onEvent: (event) => events.push(event),
  });

  await coordinator.start({
    workspaceId: 'w-agent',
    agentId: 'fake',
    model: '',
    sessionId: null,
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
  it('finds another way when its first try fails, and tells the QA what it did', async () => {
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
