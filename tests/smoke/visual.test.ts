import type { IRunEvent, IStepOutcome } from '@/shared/types';
import { mkdtemp, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PORT = 4340;

/**
 * A product page whose text is all there and whose screen is not: a button covers the price, the
 * photo is broken and the shipping note is white on white. Only an agent that sees the picture
 * fails the first three cases; the fourth works, so a blind "fail everything" does not pass either.
 */
const STEPS = [
  {
    caseId: 'TC-01',
    caseTitle: 'Price shows',
    numberInCase: 1,
    action: 'Open the product page',
    expected:
      'The price R$ 199,90 shows whole and readable, right under the product name.',
  },
  {
    caseId: 'TC-02',
    caseTitle: 'Photo loads',
    numberInCase: 1,
    action: 'Look at the product photo, on the left',
    expected: 'The photo of the shoe shows, loaded.',
  },
  {
    caseId: 'TC-03',
    caseTitle: 'Free shipping note',
    numberInCase: 1,
    action: 'Read the shipping note under the price',
    expected: 'The note "Frete grátis para todo o Brasil" is readable.',
  },
  {
    caseId: 'TC-04',
    caseTitle: 'Add to cart',
    numberInCase: 1,
    action: 'Click Adicionar ao carrinho',
    expected: 'The cart at the top shows Carrinho (1).',
  },
];

describe('a real run on a page that only looks broken', () => {
  it('fails what a person would see is wrong, and passes what works', async () => {
    const html = await readFile(
      join(import.meta.dirname, 'fixtures', 'visual-shop.html'),
    );
    const server = createServer((request, response) => {
      if (request.url !== '/') {
        response.writeHead(404).end();

        return;
      }

      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(html);
    });

    await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));

    const tools = new McpHost();
    const events: IRunEvent[] = [];

    await tools.start();

    await new RunCoordinator({
      runner: new AgentRunner({ owners: new ProcessOwners(), onEvent: () => undefined }),
      findAndroid: async () => null,
      findIos: async () => null,
      findCommand: async (id) =>
        (await new AgentDetector().detect()).find((one) => one.id === id)?.path ?? null,
      live: new LiveStream(),
      tools,
      harness: new Harness(),
      dataRoot: await mkdtemp(join(tmpdir(), 'qazinho-visual-')),
      onEvent: (event) => events.push(event),
    }).start({
      workspaceId: 'w-visual',
      agentId: 'claude-code',
      model: 'sonnet',
      target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
      runId: 'r-01',
      steps: STEPS,
    });

    server.close();
    tools.close();

    const verdicts = Object.fromEntries(
      events
        .filter(
          (event): event is { kind: 'step'; outcome: IStepOutcome } =>
            event.kind === 'step',
        )
        .map(({ outcome }) => [outcome.caseId, `${outcome.verdict} · ${outcome.got}`]),
    );

    console.log(verdicts);

    expect(verdicts['TC-01']).toMatch(/^failed/);
    expect(verdicts['TC-02']).toMatch(/^failed/);
    expect(verdicts['TC-03']).toMatch(/^failed/);
    expect(verdicts['TC-04']).toMatch(/^passed/);
  }, 300_000);
});
