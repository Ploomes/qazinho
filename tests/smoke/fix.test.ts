import type { ISuiteChange, SuiteChangeEvent } from '@/shared/types';
import { existsSync } from 'node:fs';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { GitCli } from '@/main/classes/automation/GitCli';
import { SuiteChanges } from '@/main/classes/automation/SuiteChanges';
import { changeIdOf } from '@/main/classes/automation/SuiteChanges/library';
import { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import { SuiteRunner } from '@/main/classes/automation/SuiteRunner';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { findOnPath } from '@/main/library';
import { git, teamSuite } from './fixtures/teamSuite';

const PORT = 4372;
const SHOP_KEY = 's3cret-shop-key-77';
const SDK = join(
  process.cwd(),
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
  'client',
);

/** The shop renamed its cart link to "Cart 2", which breaks CT-NAV-002's "My cart". */
const server = createServer((request, response) => {
  const path = (request.url ?? '/').split('?')[0] ?? '/';

  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(
    path === '/products'
      ? '<!doctype html><title>Products</title><h1>Products</h1>'
      : '<!doctype html><title>Shop</title><h1>Shop</h1><a href="/products">Products</a> <a href="/cart">Cart 2</a>',
  );
});

/**
 * Plays the QA's agent the way the automator works: it runs the broken test through QAzinho's
 * run_tests, fixes the locator in its copy with a plain file write, runs it again and the secret
 * test besides, then answers in the schema. It writes down what it heard and what it could see.
 */
const AGENT = (heard: string) => String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require(${JSON.stringify(join(SDK, 'index.js'))});
const { StreamableHTTPClientTransport } = require(${JSON.stringify(join(SDK, 'streamableHttp.js'))});
const argv = process.argv;
process.stdin.resume();
process.stdin.on('end', async () => {
  const config = JSON.parse(argv[argv.indexOf('--mcp-config') + 1]);
  const work = argv[argv.indexOf('--add-dir') + 1];
  const client = new Client({ name: 'fake-automator', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(config.mcpServers.qazinho.url)));
  const run = async (tests) => (await client.callTool({ name: 'run_tests', arguments: { tests, project: 'leitura' } })).content[0].text;
  const before = await run(['tests/hc-1/ct-nav.spec.ts']);
  const file = path.join(work, 'tests', 'hc-1', 'ct-nav.spec.ts');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace("{ name: 'My cart' }", '{ name: /^Cart/ }'));
  const after = await run(['tests/hc-1/ct-nav.spec.ts']);
  const secret = await run(['tests/hc-12/ct-secret.spec.ts']);
  fs.writeFileSync(${JSON.stringify(heard)}, JSON.stringify({ before, after, secret, sees: process.env.SHOP_KEY ?? null }));
  await client.close();
  const say = (line) => console.log(JSON.stringify({ ...line, session_id: 's-1' }));
  say({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: file } }] } });
  say({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'StructuredOutput', input: {
    outcome: 'changed',
    summary: 'The cart link is "Cart 2" now; the test finds it by its start.',
    commit: 'fix(hc-1): find the cart by its new name',
    title: 'CT-NAV-002: find the cart by its new name',
    body: 'The menu link was renamed.',
  } }] } });
  say({ type: 'result', subtype: 'success', is_error: false, result: '', total_cost_usd: 0.02 });
});
`;

const events: SuiteChangeEvent[] = [];
let folder = '';
let repo = '';
let remote = '';
let heard = '';
let changes: SuiteChanges;
let change: ISuiteChange;
let tools: McpHost;

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  ({ folder, repo, remote } = await teamSuite());
  heard = join(folder, 'heard.json');

  const agent = join(folder, 'agent');

  await writeFile(agent, AGENT(heard));
  await chmod(agent, 0o755);

  const directories = (process.env.PATH ?? '').split(':');
  const cli = new GitCli({ directories: async () => directories });
  const root = join(folder, 'suites');
  const registry = new SuiteRegistry({ root, git: cli });
  const values = async () => [
    { name: 'SHOP_KEY', description: 'The shop key', value: SHOP_KEY },
  ];
  const suites = new SuiteRunner({
    registry,
    node: async () => findOnPath({ command: 'node', directories }),
    env: async () => ({
      PATH: process.env.PATH ?? '',
      SHOP_URL: `http://127.0.0.1:${String(PORT)}/`,
      SHOP_KEY,
    }),
    values,
    root,
    urlOf: () => null,
    onEvent: () => undefined,
  });

  tools = new McpHost();
  await tools.start();
  await registry.connect({ projectId: 'p', path: repo });

  const run = await suites.run({
    projectId: 'p',
    runId: 's-01',
    batches: [{ project: 'leitura', filters: ['tests/hc-1/ct-nav.spec.ts'] }],
    expected: 3,
  });
  const broken = run.results.find(({ title }) => title.startsWith('CT-NAV-002'));
  const runner = new AgentRunner({
    owners: new ProcessOwners(),
    folder: join(folder, 'agent-home'),
    onEvent: (event) => {
      const changeId = changeIdOf(event.workspaceId);

      if (changeId !== null && (event.kind === 'text' || event.kind === 'action'))
        changes.hear({ changeId, text: event.text });
    },
  });

  changes = new SuiteChanges({
    registry,
    suites,
    git: cli,
    github: { api: () => Promise.reject(new Error('GitHub is not reached here')) },
    runner,
    harness: new Harness(),
    tools,
    findCommand: async () => agent,
    values,
    path: async () => process.env.PATH ?? '',
    root,
    onEvent: (event) => events.push(event),
  });
  change = await changes.start({
    projectId: 'p',
    changeId: 'c-01',
    agentId: 'claude-code',
    model: '',
    language: 'en',
    projects: ['leitura', 'altera'],
    ask: {
      kind: 'fix',
      runId: 's-01',
      test: {
        id: broken?.testId ?? '',
        file: 'tests/hc-1/ct-nav.spec.ts',
        line: broken?.line ?? 0,
        path: ['CT-NAV · Navigation'],
        title: broken?.title ?? '',
        tags: [],
        project: 'leitura',
      },
    },
  });
}, 300_000);

afterAll(() => {
  tools.close();
  server.closeAllConnections();
  server.close();
});

describe("the QA's agent fixes a test of the team's suite", () => {
  it('runs the broken test through QAzinho in its copy, fixes it, and QAzinho sees it pass', () => {
    expect(change).toMatchObject({
      status: 'ready',
      branch: 'qazinho/fix-ct-nav-002-opens-the-cart-from-the-menu',
      base: 'main',
      checks: [expect.objectContaining({ status: 'passed' })],
    });
    expect(change.files).toEqual([
      expect.objectContaining({
        path: 'tests/hc-1/ct-nav.spec.ts',
        status: 'modified',
        additions: 1,
        deletions: 1,
      }),
    ]);
  });

  it('tells the agent how each run went, a secret by its name, and keeps the secret from it', async () => {
    const read = JSON.parse(await readFile(heard, 'utf8')) as {
      before: string;
      after: string;
      secret: string;
      sees: string | null;
    };

    expect(read.before).toContain('Ran 2 tests: 1 passed, 1 failed, 0 skipped.');
    expect(read.before).toContain('My cart');
    expect(read.after).toContain('Ran 2 tests: 2 passed, 0 failed, 0 skipped.');
    expect(read.secret).toContain('${SHOP_KEY}');
    expect(read.secret).not.toContain(SHOP_KEY);
    expect(read.sees).toBeNull();
    expect(events.filter(({ kind }) => kind === 'ran')).toHaveLength(3);
  });

  it("leaves the QA's own clone as it was", () => {
    expect(git({ cwd: repo, args: ['status', '--porcelain'] })).toBe('');
    expect(git({ cwd: repo, args: ['rev-parse', '--abbrev-ref', 'HEAD'] })).toBe('main');
  });

  it('sends the branch with the agent commit once the QA approves, and drops the copy', async () => {
    const sent = await changes.ship({ projectId: 'p', changeId: 'c-01', way: 'branch' });

    expect(sent).toMatchObject({ isOk: true, change: { status: 'shipped' } });
    expect(
      git({ cwd: remote, args: ['log', '-1', '--format=%an %s', change.branch] }),
    ).toBe('QA fix(hc-1): find the cart by its new name');
    expect(existsSync(join(folder, 'suites', 'p', 'changes', 'c-01', 'work'))).toBe(
      false,
    );
  });
});
