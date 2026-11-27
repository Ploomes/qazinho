import type { IRunEvent } from '@/shared/types';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { Harness, McpHost } from '@ploomes/qazinho-harness';

const PORT = 4350;

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

// Anota a mensagem com que cada caso abre, registra um bug ao lado do passo do primeiro
// caso, depois relata o passo como passou, do jeito que mandam o runner fazer.
const NOTICING = (prompts: string) => `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const fs = require('node:fs');
const argv = process.argv;
let prompt = '';
process.on('SIGINT', () => process.exit(0));
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  const turn = fs.readdirSync(${JSON.stringify(prompts)}).length;
  fs.writeFileSync(${JSON.stringify(prompts)} + '/turn-' + turn, prompt);
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  if (turn === 0)
    await client.callTool({ name: 'bug', arguments: {
      title: 'Yearly price differs', severity: 'medium',
      expected: 'One yearly price', got: '$20.49 on the page, $20.40 on the phone',
    } });
  await client.callTool({ name: 'report', arguments: { step: 1, verdict: 'passed', why: 'It says Shop.', got: 'Shop' } });
  setInterval(() => undefined, 1000);
});
`;

describe('a bug on the side of a step', () => {
  /**
   * O runner viu um preço errado que o passo dele não perguntava e só podia deixar uma
   * nota: o bug nunca chegava a Bugs. Agora ele o registra, com a tela que viu, e os
   * casos seguintes são avisados.
   */
  it('files it with its screen, keeps the step passed, and tells the next case it is filed', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><h1>Shop</h1><p>Yearly $20.49</p>');
    });

    await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));

    const root = await mkdtemp(join(tmpdir(), 'qazinho-finding-'));
    const prompts = join(root, 'prompts');
    const agent = join(root, 'agent');

    await writeFile(agent, NOTICING(prompts));
    await chmod(agent, 0o755);
    await mkdir(prompts);

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
      workspaceId: 'w-finding',
      agentId: 'fake',
      model: '',
      target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
      runId: 'r-01',
      steps: [step('TC-01'), step('TC-02')],
      language: 'en',
    });

    const findings = events.flatMap((event) => (event.kind === 'finding' ? [event] : []));
    const steps = events.flatMap((event) =>
      event.kind === 'step' ? [event.outcome] : [],
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]?.finding).toMatchObject({
      caseId: 'TC-01',
      stepNumber: 1,
      title: 'Yearly price differs',
      action: 'Look at the page',
    });
    expect(findings[0]?.finding.shotFile).toMatch(/finding-1-1\.jpg$/);
    expect(steps.map(({ verdict }) => verdict)).toEqual(['passed', 'passed']);
    expect(await readFile(join(prompts, 'turn-1'), 'utf8')).toContain(
      'Bugs this run already filed, not to file again; they have no id yet, so a step that fails for one is reported with its title:\n- Yearly price differs',
    );

    deviceTools.close();
    site.close();
  });
});
