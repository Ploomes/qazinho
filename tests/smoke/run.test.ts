import type { IRunEvent } from '@/types';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PAGE = `<!doctype html><html><body>
  <h1>Test shop</h1>
  <label for="q">Search</label>
  <input id="q" name="q" placeholder="Search products" />
  <button id="add" onclick="document.getElementById('out').textContent='Added to cart'">Add to cart</button>
  <p id="out">Cart is empty</p>
</body></html>`;

describe('a real run', () => {
  it('drives a real browser with the real agent', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(PAGE);
    });

    await new Promise<void>((ready) => server.listen(4321, '127.0.0.1', ready));

    const owners = new ProcessOwners();
    const events: IRunEvent[] = [];

    const coordinator = new RunCoordinator({
      runner: new AgentRunner({ owners, onEvent: () => undefined }),
      findAndroid: async () => null,
      findIos: async () => null,
      findCommand: async (id) =>
        (await new AgentDetector().detect()).find((one) => one.id === id)?.path ?? null,
      live: new LiveStream(),
      dataRoot: await mkdtemp(join(tmpdir(), 'gocrash-smoke-')),
      onEvent: (event) => events.push(event),
    });

    await coordinator.start({
      workspaceId: 'w-smoke',
      agentId: 'claude-code',
      model: 'sonnet',
      sessionId: null,
      target: { kind: 'web' as const, value: 'http://127.0.0.1:4321/' },
      runId: 'r-01',
      steps: [
        {
          caseId: 'TC-01',
          caseTitle: 'Cart',
          numberInCase: 1,
          action: 'Click the Add to cart button',
          expected: 'The page says the item was added to the cart',
        },
        {
          caseId: 'TC-01',
          caseTitle: 'Cart',
          numberInCase: 2,
          action: 'Read the cart total on the page',
          expected: 'The page shows a cart total in dollars',
        },
        {
          caseId: 'TC-01',
          caseTitle: 'Cart',
          numberInCase: 3,
          action: 'Click the checkout button',
          expected: 'The checkout page opens',
        },
      ],
    });

    server.close();

    for (const event of events)
      console.log(
        event.kind === 'step'
          ? `step ${String(event.outcome.index)} ${event.outcome.verdict} · title="${event.outcome.title}" · severity=${event.outcome.severity} · why=${event.outcome.why} · got=${event.outcome.got} · shot=${String(event.outcome.screenshot?.length ?? 0)} bytes at ${String(event.outcome.shotFile)}`
          : JSON.stringify(event),
      );

    expect(events.at(-1)?.kind).toBe('done');
    expect(events.some((event) => event.kind === 'step')).toBe(true);
  }, 300_000);
});
