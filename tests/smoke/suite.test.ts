import type { ISuiteRun, SuiteEvent } from '@/shared/types';
import { existsSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GitCli } from '@/main/classes/automation/GitCli';
import { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import { SuiteRunner } from '@/main/classes/automation/SuiteRunner';
import { findOnPath } from '@/main/library';

const PORT = 4371;
const SHOP_KEY = 's3cret-shop-key-42';
const SUITE = join(process.cwd(), 'tests', 'smoke', 'fixtures', 'suite');

/** A shop with a home that links to its products, and no cart link: CT-NAV-002 fails on it. */
const server = createServer((request, response) => {
  const isProducts = (request.url ?? '/').startsWith('/products');

  response.writeHead(200, { 'content-type': 'text/html' });
  response.end(
    isProducts
      ? '<!doctype html><title>Products</title><h1>Products</h1>'
      : '<!doctype html><title>Shop</title><h1>Shop</h1><a href="/products">Products</a>',
  );
});

const directories = (process.env.PATH ?? '').split(':');
const events: SuiteEvent[] = [];
let root = '';
let registry: SuiteRegistry;
let runner: SuiteRunner;

const resultOf = (props: { run: ISuiteRun; title: string }) =>
  props.run.results.find(({ title }) => title.startsWith(props.title));

beforeAll(async () => {
  await new Promise<void>((ready) => server.listen(PORT, '127.0.0.1', ready));
  root = await mkdtemp(join(tmpdir(), 'qazinho-suite-'));
  registry = new SuiteRegistry({
    root,
    git: new GitCli({ directories: async () => directories }),
  });
  runner = new SuiteRunner({
    registry,
    node: async () => findOnPath({ command: 'node', directories }),
    env: async () => ({
      PATH: process.env.PATH ?? '',
      SHOP_URL: `http://127.0.0.1:${String(PORT)}/`,
      SHOP_KEY,
    }),
    values: async () => [
      { name: 'SHOP_KEY', description: 'The shop key', value: SHOP_KEY },
    ],
    root,
    urlOf: ({ runId, file }) => `served:${runId}/${file}`,
    onEvent: (event) => events.push(event),
  });
});

afterAll(() => {
  server.closeAllConnections();
  server.close();
});

describe("a team's own Playwright suite", () => {
  it('connects the folder that holds the config, and reads its Playwright', async () => {
    const pick = await registry.connect({ projectId: 'p', path: SUITE });

    expect(pick).toMatchObject({
      kind: 'picked',
      suite: { config: 'playwright.config.ts', name: 'suite' },
    });
    expect(pick.kind === 'picked' ? pick.suite.version : null).toMatch(/^\d+\.\d+/);
  });

  it('lists each test once for each project it runs in, with its folder and tags', async () => {
    const list = await runner.list('p');

    expect(list.kind).toBe('listed');

    const tests = list.kind === 'listed' ? list.tests : [];

    expect(list.kind === 'listed' ? list.projects : []).toEqual(['leitura', 'altera']);
    expect(tests.map(({ title, project }) => `${project} ${title}`).sort()).toEqual([
      'altera CT-NAV-003 · Saves the profile @altera-dados',
      'leitura CT-FLK-001 · Passes on its retry',
      'leitura CT-NAV-001 · Opens the products',
      'leitura CT-NAV-002 · Opens the cart from the menu',
      'leitura CT-OTH-001 · Opens the home page',
      'leitura CT-SEC-001 · Reads the shop key',
    ]);
    expect(tests.find(({ title }) => title.startsWith('CT-NAV-001'))).toMatchObject({
      file: 'tests/hc-1/ct-nav.spec.ts',
      path: ['CT-NAV · Navigation'],
    });
  });

  it('runs the whole suite a project at a time, with each step, failure and flaky pass', async () => {
    const run = await runner.run({
      projectId: 'p',
      runId: 's-01',
      batches: [
        { project: 'leitura', filters: [] },
        { project: 'altera', filters: [] },
      ],
      expected: 6,
    });
    const started = events.find(
      (event): event is Extract<SuiteEvent, { kind: 'started' }> =>
        event.kind === 'started',
    );

    expect(started?.run.total).toBe(6);
    expect(run).toMatchObject({ status: 'failed', total: 6 });
    expect(resultOf({ run, title: 'CT-NAV-001' })).toMatchObject({
      status: 'passed',
      project: 'leitura',
    });
    expect(resultOf({ run, title: 'CT-NAV-003' })).toMatchObject({
      status: 'passed',
      project: 'altera',
    });
    expect(resultOf({ run, title: 'CT-FLK-001' })).toMatchObject({
      status: 'passed',
      isFlaky: true,
    });
    expect(
      events.some((event) => event.kind === 'step' && event.title === 'Click Products'),
    ).toBe(true);

    const failed = resultOf({ run, title: 'CT-NAV-002' });

    expect(failed).toMatchObject({ status: 'failed', file: 'tests/hc-1/ct-nav.spec.ts' });
    expect(failed?.error).toContain('My cart');

    const kept = failed?.attachments.find(({ name }) => name === 'screenshot');

    expect(kept?.url).toBe(`served:s-01/${kept?.file ?? ''}`);
    expect(existsSync(join(root, 'p', 'runs', 's-01', kept?.file ?? 'none'))).toBe(true);
    expect(failed?.attachments.some(({ name }) => name === 'trace')).toBe(true);
  }, 180_000);

  /** The variable reaches the test from the environment, and its value never reaches the page or a run's file. */
  it("reads a variable's value back as its name in what a test says", async () => {
    const run = (await runner.runs('p')).find(({ id }) => id === 's-01');
    const error =
      run?.results.find(({ title }) => title.startsWith('CT-SEC-001'))?.error ?? '';

    expect(error).toContain('${SHOP_KEY}');
    expect(error).not.toContain(SHOP_KEY);
  });

  it('runs one test by where it is written, and nothing beside it', async () => {
    const run = await runner.run({
      projectId: 'p',
      runId: 's-02',
      batches: [{ project: 'leitura', filters: ['tests/hc-1/ct-nav.spec.ts:4'] }],
      expected: 1,
    });

    expect(run.results.map(({ title }) => title)).toEqual([
      'CT-NAV-001 · Opens the products',
    ]);
    expect(run.status).toBe('passed');
  }, 120_000);

  it('stops a run going, and keeps what it reached', async () => {
    const going = runner.run({
      projectId: 'p',
      runId: 's-03',
      batches: [{ project: 'leitura', filters: [] }],
      expected: 5,
    });

    for (let wait = 0; wait < 300; wait += 1) {
      if (events.some((event) => event.kind === 'testStarted' && event.runId === 's-03'))
        break;

      await new Promise((later) => setTimeout(later, 100));
    }

    runner.stop('p');

    expect((await going).status).toBe('stopped');
  }, 120_000);

  it('keeps every run, the latest first', async () => {
    expect((await runner.runs('p')).map(({ id, status }) => `${id} ${status}`)).toEqual([
      's-03 stopped',
      's-02 passed',
      's-01 failed',
    ]);
  });
});
