import type { IRunEvent } from '@/shared/types';
import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { Harness, McpHost } from '@salve-software/qazinho-harness';

const PORT = 4348;

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

// Relata o único passo dele e espera, do jeito que o Claude Code faz quando a ferramenta
// responde. A interrupção do QAzinho é Ctrl+C, e o Claude Code a responde com uma linha
// final que diz quanto o turno custou: este também.
const PAYING = `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
process.on('SIGINT', () => {
  console.log(JSON.stringify({ type: 'result', subtype: 'error_during_execution', is_error: true, total_cost_usd: 0.02 }));
  process.exit(0);
});
process.stdin.resume();
process.stdin.on('end', async () => {
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  await client.callTool({ name: 'report', arguments: { step: 1, verdict: 'passed', why: 'It says Shop.', got: 'Shop' } });
  setInterval(() => undefined, 1000);
});
`;

describe('what a run cost', () => {
  /**
   * O agente era terminado com SIGTERM no momento em que o caso dele acabava, e o SIGTERM
   * não deixa linha final: nenhum caso dizia quanto custou. O Ctrl+C deixa, e a run
   * espera por ela antes de terminar.
   */
  it('hears what each case cost from its agent, all of it before the run ends', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><h1>Shop</h1>');
    });

    await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));

    const root = await mkdtemp(join(tmpdir(), 'qazinho-cost-'));
    const agent = join(root, 'agent');

    await writeFile(agent, PAYING);
    await chmod(agent, 0o755);

    const events: IRunEvent[] = [];
    const deviceTools = new McpHost();

    await deviceTools.start();

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
      tools: deviceTools,
      harness: new Harness(),
      dataRoot: root,
      onEvent: (event) => events.push(event),
    });

    const step = (caseId: string) => ({
      caseId,
      caseTitle: 'Shop',
      casePriority: 'P1',
      caseGoal: '',
      casePreconditions: '',
      numberInCase: 1,
      action: 'Look at the page',
      expected: 'It says Shop',
    });

    await coordinator.start({
      workspaceId: 'w-cost',
      agentId: 'fake',
      model: '',
      target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
      runId: 'r-01',
      language: 'en',
      steps: [step('TC-01'), step('TC-02')],
    });

    const costs = events.filter((event) => event.kind === 'cost');

    expect(costs).toEqual([
      { kind: 'cost', workspaceId: 'w-cost', costUsd: 0.02 },
      { kind: 'cost', workspaceId: 'w-cost', costUsd: 0.02 },
    ]);
    expect(events.at(-1)).toEqual({ kind: 'done', workspaceId: 'w-cost' });
    expect(events.filter((event) => event.kind === 'step')).toHaveLength(2);

    deviceTools.close();
    site.close();
  });
});
