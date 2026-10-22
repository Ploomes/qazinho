import type { IRunEvent } from '@/shared/types';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PORT = 4390;

const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

const DESIGN = {
  url: 'https://www.figma.com/design/AbC123/Shop?node-id=1-2',
  fileKey: 'AbC123',
  nodeId: '1:2',
  name: 'Shop',
};

// Writes down how it was called and the message each case opens with. On a case that names a
// frame it measures the button, files the difference on that frame, and passes the step; it never
// reaches Figma, which only a real agent signed in to it can.
const DESIGNER = (folder: string) => `#!/usr/bin/env node
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const fs = require('node:fs');
const argv = process.argv;
let prompt = '';
process.on('SIGINT', () => process.exit(0));
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  const turn = fs.readdirSync(${JSON.stringify(folder)}).filter((name) => name.startsWith('turn-')).length;
  fs.writeFileSync(${JSON.stringify(folder)} + '/turn-' + turn, prompt);
  fs.writeFileSync(${JSON.stringify(folder)} + '/argv-' + turn, JSON.stringify(argv.slice(2)));
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const client = new Client({ name: 'fake-agent', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  if (prompt.startsWith('Explore the app')) {
    await client.callTool({ name: 'screen', arguments: { name: 'Checkout', about: 'Where the buyer pays.' } });
    await client.callTool({ name: 'inspect', arguments: { target: 'Pay now' } });
    await client.callTool({ name: 'bug', arguments: {
      title: 'Pay now button: corners 8px, not 12px', severity: 'low',
      expected: 'Corners 12px', got: 'Corners 8px', frame: '12:345',
    } });
    const finish = { summary: 'One screen, off the design.', cases: [{ title: 'Checkout matches the design', priority: 'P2', goal: 'The checkout is as designed.', preconditions: '', steps: [{ action: 'Open the checkout', expected: 'The Pay now button', frame: '12:345' }] }] };
    const said = await client.callTool({ name: 'finish', arguments: finish });
    if (said.content[0].text.includes('still left')) await client.callTool({ name: 'finish', arguments: finish });
    await client.close();
    console.log(JSON.stringify({ type: 'result', result: '', is_error: false, session_id: 's1', total_cost_usd: 0.01 }));
    return;
  }
  if (prompt.includes('Its screen should match Figma frame 12:345.')) {
    const measured = await client.callTool({ name: 'inspect', arguments: { target: 'Pay now' } });
    fs.writeFileSync(${JSON.stringify(folder)} + '/inspect', measured.content[0].text);
    await client.callTool({ name: 'bug', arguments: {
      title: 'Pay now button: corners 8px, not 12px', severity: 'low',
      expected: 'Corners 12px, as frame 12:345 draws them', got: 'Corners 8px',
      frame: '12:345',
    } });
  }
  await client.callTool({ name: 'report', arguments: { step: 1, verdict: 'passed', why: 'The button shows.', got: 'Pay now' } });
  setInterval(() => undefined, 1000);
});
`;

describe('a run against a Figma design', () => {
  it('hands a case with a frame the QA’s Figma, and files what it measured off the design on that frame', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(
        '<!doctype html><h1>Checkout</h1><button style="padding:12px 16px;border:0;border-radius:8px;background:#1f6feb;color:#fff;font:600 16px/24px Arial">Pay now</button>',
      );
    });

    await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));

    const root = await mkdtemp(join(tmpdir(), 'qazinho-design-'));
    const folder = join(root, 'calls');
    const agent = join(root, 'agent');

    await writeFile(agent, DESIGNER(folder));
    await chmod(agent, 0o755);
    await mkdir(folder);

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
      caseTitle: 'Checkout',
      casePriority: 'P1',
      caseGoal: '',
      casePreconditions: '',
      numberInCase: 1,
      action: 'Look at the checkout',
      expected: 'The Pay now button',
    });

    await coordinator.start({
      workspaceId: 'w-design',
      agentId: 'claude-code',
      model: '',
      target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
      runId: 'r-01',
      steps: [{ ...step('TC-01'), frame: '12:345' }, step('TC-02')],
      language: 'en',
      design: DESIGN,
    });

    const argvOf = async (turn: number) =>
      JSON.parse(
        await readFile(join(folder, `argv-${String(turn)}`), 'utf8'),
      ) as string[];
    const serversOf = (argv: string[]) =>
      (
        JSON.parse(argv[argv.indexOf('--mcp-config') + 1] ?? '{}') as {
          mcpServers: Record<string, { type?: string; url: string }>;
        }
      ).mcpServers;
    const framed = await argvOf(0);
    const plain = await argvOf(1);

    expect(serversOf(framed).figma).toEqual({
      type: 'http',
      url: 'https://mcp.figma.com/mcp',
    });
    expect(framed).toContain('mcp__figma__get_design_context');
    expect(framed).not.toContain('mcp__figma__use_figma');
    expect(serversOf(plain).figma).toBeUndefined();
    expect(plain.some((one) => one.startsWith('mcp__figma'))).toBe(false);

    expect(await readFile(join(folder, 'turn-0'), 'utf8')).toContain(
      'Figma design: https://www.figma.com/design/AbC123/Shop?node-id=1-2 (fileKey AbC123).',
    );

    const measured = await readFile(join(folder, 'inspect'), 'utf8');

    expect(measured).toContain('"Pay now" (button), measured in CSS px:');
    expect(measured).toContain('corners 8px');

    const findings = events.flatMap((event) => (event.kind === 'finding' ? [event] : []));

    expect(findings).toHaveLength(1);
    expect(findings[0]?.finding).toMatchObject({
      caseId: 'TC-01',
      title: 'Pay now button: corners 8px, not 12px',
      frame: '12:345',
    });

    deviceTools.close();
    site.close();
  });

  it('hands an exploration the QA’s Figma and the design, and files what is off it on its frame', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(
        '<!doctype html><h1>Checkout</h1><button style="border-radius:8px">Pay now</button>',
      );
    });

    await new Promise<void>((ready) => site.listen(PORT + 1, '127.0.0.1', ready));

    const root = await mkdtemp(join(tmpdir(), 'qazinho-design-explore-'));
    const folder = join(root, 'calls');
    const agent = join(root, 'agent');

    await writeFile(agent, DESIGNER(folder));
    await chmod(agent, 0o755);
    await mkdir(folder);
    await mkdir(join(root, 'workspaces', 'w-design'), { recursive: true });

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

    await coordinator.start({
      workspaceId: 'w-design',
      agentId: 'claude-code',
      model: '',
      target: { kind: 'web', value: `http://127.0.0.1:${String(PORT + 1)}/` },
      runId: 'r-02',
      steps: [],
      language: 'en',
      mode: 'explore',
      minutes: 10,
      design: DESIGN,
    });

    const argv = JSON.parse(await readFile(join(folder, 'argv-0'), 'utf8')) as string[];
    const servers = (
      JSON.parse(argv[argv.indexOf('--mcp-config') + 1] ?? '{}') as {
        mcpServers: Record<string, { url: string }>;
      }
    ).mcpServers;

    expect(servers.figma?.url).toBe('https://mcp.figma.com/mcp');
    expect(argv).toContain('mcp__figma__get_metadata');
    expect(await readFile(join(folder, 'turn-0'), 'utf8')).toContain(
      '(fileKey AbC123, node 1:2). Hold each screen it draws to its frame.',
    );

    const finding = events.find((event) => event.kind === 'finding');
    const explored = events.find((event) => event.kind === 'explored');

    expect(finding?.kind === 'finding' ? finding.finding.frame : null).toBe('12:345');
    expect(
      explored?.kind === 'explored' ? explored.cases[0]?.steps[0]?.frame : null,
    ).toBe('12:345');

    deviceTools.close();
    site.close();
  });
});
