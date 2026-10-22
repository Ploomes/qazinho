import type { ISuiteChange } from '@/shared/types';
import { existsSync } from 'node:fs';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { GitCli } from '@/main/classes/automation/GitCli';
import { SuiteChanges } from '@/main/classes/automation/SuiteChanges';
import { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import { SuiteRunner } from '@/main/classes/automation/SuiteRunner';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { findOnPath } from '@/main/library';
import { git, teamSuite } from './fixtures/teamSuite';

const PORT = 4373;
const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

/** A shop whose menu opens the cart, which no test of the suite checks yet. */
const server = createServer((request, response) => {
  const path = (request.url ?? '/').split('?')[0] ?? '/';

  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(
    path === '/cart'
      ? '<!doctype html><title>Cart</title><h1>Cart</h1>'
      : '<!doctype html><title>Shop</title><h1>Shop</h1><a href="/cart">Cart 2</a>',
  );
});

/**
 * Plays the automator asked for a new test: it checks it got the test to write, writes the spec
 * the way it would with Write, runs it through QAzinho's run_tests, and answers in the schema.
 */
const AGENT = (heard: string) => String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
let prompt = '';
process.stdin.on('data', (chunk) => { prompt += chunk; });
process.stdin.on('end', async () => {
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const work = argv[argv.indexOf('--add-dir') + 1];
  const file = path.join(work, 'tests', 'hc-12', 'ct-cart.spec.ts');
  fs.writeFileSync(file, [
    "import { expect, test } from '@playwright/test';",
    '',
    "test('CT-CRT-001 · The menu opens the cart', async ({ page }) => {",
    "  await page.goto('/');",
    "  await page.getByRole('link', { name: /^Cart/ }).click();",
    "  await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();",
    '});',
    '',
  ].join('\n'));
  const client = new Client({ name: 'fake-automator', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const ran = (await client.callTool({ name: 'run_tests', arguments: { tests: ['tests/hc-12/ct-cart.spec.ts'], project: 'leitura' } })).content[0].text;
  await client.close();
  fs.writeFileSync(${JSON.stringify(heard)}, JSON.stringify({ prompt, ran }));
  const say = (line) => console.log(JSON.stringify({ ...line, session_id: 's-1' }));
  say({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'StructuredOutput', input: {
    outcome: 'changed',
    summary: 'Wrote CT-CRT-001 in tests/hc-12.',
    commit: 'test(hc-12): the menu opens the cart',
    title: 'CT-CRT-001: the menu opens the cart',
    body: 'A new test.',
  } }] } });
  say({ type: 'result', subtype: 'success', is_error: false, result: '', total_cost_usd: 0.02 });
});
`;

let folder = '';
let remote = '';
let heard = '';
let changes: SuiteChanges;
let change: ISuiteChange;
let tools: McpHost;

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  ({ folder, remote } = await teamSuite());
  heard = join(folder, 'heard.json');

  const repo = join(folder, 'e2e');
  const agent = join(folder, 'agent');

  await writeFile(agent, AGENT(heard));
  await chmod(agent, 0o755);

  const directories = (process.env.PATH ?? '').split(':');
  const cli = new GitCli({ directories: async () => directories });
  const root = join(folder, 'suites');
  const registry = new SuiteRegistry({ root, git: cli });
  const suites = new SuiteRunner({
    registry,
    node: async () => findOnPath({ command: 'node', directories }),
    env: async () => ({
      PATH: process.env.PATH ?? '',
      SHOP_URL: `http://127.0.0.1:${String(PORT)}/`,
    }),
    values: async () => [],
    root,
    urlOf: () => null,
    onEvent: () => undefined,
  });

  tools = new McpHost();
  await tools.start();
  await registry.connect({ projectId: 'p', path: repo });
  changes = new SuiteChanges({
    registry,
    suites,
    git: cli,
    github: { api: () => Promise.reject(new Error('GitHub is not reached here')) },
    runner: new AgentRunner({
      owners: new ProcessOwners(),
      folder: join(folder, 'agent-home'),
      onEvent: () => undefined,
    }),
    harness: new Harness(),
    tools,
    findCommand: async () => agent,
    values: async () => [],
    path: async () => process.env.PATH ?? '',
    root,
    onEvent: () => undefined,
  });
  change = await changes.start({
    projectId: 'p',
    changeId: 'c-01',
    agentId: 'claude-code',
    model: '',
    language: 'en',
    projects: ['leitura', 'altera'],
    ask: {
      kind: 'write',
      text: 'The menu opens the cart.',
      folder: 'tests/hc-12',
      source: null,
    },
  });
}, 300_000);

afterAll(() => {
  tools.close();
  server.closeAllConnections();
  server.close();
});

describe("the QA's agent writes a new test in the team's suite", () => {
  it('hands the agent the test to write and where, and lets it run it through QAzinho', async () => {
    const read = JSON.parse(await readFile(heard, 'utf8')) as {
      prompt: string;
      ran: string;
    };

    expect(read.prompt).toContain('## The test to write');
    expect(read.prompt).toContain('The QA asks for a new test: The menu opens the cart.');
    expect(read.prompt).toContain('Put it in tests/hc-12.');
    expect(read.ran).toContain('Ran 1 test: 1 passed, 0 failed, 0 skipped.');
  });

  it("keeps the new spec as the change, and QAzinho runs its file's tests again", () => {
    expect(change).toMatchObject({
      status: 'ready',
      branch: 'qazinho/test-the-menu-opens-the-cart',
      checks: [
        expect.objectContaining({
          title: 'CT-CRT-001 · The menu opens the cart',
          status: 'passed',
        }),
      ],
    });
    expect(change.files).toEqual([
      expect.objectContaining({
        path: 'tests/hc-12/ct-cart.spec.ts',
        status: 'added',
        additions: 7,
      }),
    ]);
  });

  it('sends the branch with the new test once the QA approves', async () => {
    const sent = await changes.ship({ projectId: 'p', changeId: 'c-01', way: 'branch' });

    expect(sent).toMatchObject({ isOk: true, change: { status: 'shipped' } });
    expect(git({ cwd: remote, args: ['log', '-1', '--format=%s', change.branch] })).toBe(
      'test(hc-12): the menu opens the cart',
    );
    expect(
      git({ cwd: remote, args: ['show', '--stat', '--format=', change.branch] }),
    ).toContain('tests/hc-12/ct-cart.spec.ts');
    expect(existsSync(join(folder, 'suites', 'p', 'changes', 'c-01', 'work'))).toBe(
      false,
    );
  });
});
