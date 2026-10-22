// @vitest-environment jsdom
import type {
  IStartSuiteChange,
  IStartSuiteRun,
  ISuite,
  ISuiteChange,
  SuiteList,
  SuitePick,
} from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  suiteResult,
  suiteRun,
  suiteTest,
} from '@/modules/Automation/library/__tests__/fixtures';
import { useAutomationViewModel } from '@/modules/Automation/screens/Automation/hooks/useAutomationViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useSuiteStore,
} from '@/store';

const SUITE: ISuite = {
  projectId: 'p1',
  path: '/qa/e2e',
  name: 'chat-e2e',
  config: 'playwright.config.ts',
  version: '1.63.0',
  branch: 'main',
  repository: 'acme/chat-e2e',
  envKeys: [],
  envFileKeys: [],
};
const NAV = suiteTest({ id: 'nav', file: 'tests/hc-1/ct-nav.spec.ts', line: 5 });
const CART = suiteTest({
  id: 'cart',
  file: 'tests/hc-1/ct-cart.spec.ts',
  line: 8,
  title: 'CT-CART-001 · Abre o carrinho',
});
const SAVE = suiteTest({
  id: 'save',
  file: 'tests/hc-2/ct-save.spec.ts',
  line: 12,
  title: 'CT-SAVE-001 · Salva a versão',
  tags: ['altera-dados'],
  project: 'salva-versao',
});
const LISTED: SuiteList = {
  kind: 'listed',
  tests: [NAV, CART, SAVE],
  projects: ['chromium', 'salva-versao'],
};

let listed: SuiteList = LISTED;
let pick: SuitePick = { kind: 'picked', suite: SUITE };
let started: IStartSuiteRun[] = [];
let fixes: IStartSuiteChange[] = [];
let stopped: string[] = [];
let listings = 0;

beforeEach(() => {
  listed = LISTED;
  pick = { kind: 'picked', suite: SUITE };
  started = [];
  fixes = [];
  stopped = [];
  listings = 0;
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    pickSuite: () => Promise.resolve(pick),
    suiteOf: () => Promise.resolve(SUITE),
    listSuite: () => {
      listings += 1;

      return Promise.resolve(listed);
    },
    runSuite: (start) => {
      started.push(start);

      return Promise.resolve();
    },
    stopSuite: (projectId) => {
      stopped.push(projectId);

      return Promise.resolve();
    },
    startSuiteChange: (start) => {
      fixes.push(start);

      return new Promise<ISuiteChange>(() => undefined);
    },
  };
  useAppStore.setState({
    projects: [{ id: 'p1', name: 'Shop', targets: [], repositories: [] }],
    screen: 'automation',
    automationProjectId: 'p1',
    modal: null,
    editingProjectId: null,
    projectSection: null,
  });
  useSuiteStore.setState({
    suites: { p1: SUITE },
    lists: {},
    runs: {},
    live: {},
    picked: {},
    changes: {},
    changeNotes: {},
  });
  useSettingsStore.setState({ agent: 'Claude Code', model: 'haiku', language: 'pt' });
  useMachineStore.setState({
    agents: [
      {
        id: 'claude-code',
        name: 'Claude Code',
        command: 'claude',
        isFound: true,
        path: '/bin/claude',
        defaultModel: null,
        isSignedIn: true,
      },
    ],
  });
  useSetupStore.setState({ integrations: [] });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

async function listedView() {
  const view = renderHook(() => useAutomationViewModel());

  await waitFor(() => {
    expect(view.result.current.listView).toBe('tree');
  });

  return view.result;
}

describe('useAutomationViewModel', () => {
  describe('the suite', () => {
    it('reads the tests of a suite the first time it shows, saying so meanwhile', async () => {
      const { result } = renderHook(() => useAutomationViewModel());

      expect(result.current).toMatchObject({ listView: 'loading', isListing: true });

      await waitFor(() => {
        expect(result.current.listView).toBe('tree');
      });
      expect(result.current).toMatchObject({
        name: 'chat-e2e',
        runner: 'Playwright 1.63.0',
        branch: 'main',
        repository: 'acme/chat-e2e',
        count: '3 tests',
        isListing: false,
      });
    });

    it('does NOT read the tests again each time the screen comes back', async () => {
      await listedView();
      cleanup();
      await listedView();

      expect(listings).toBe(1);
    });

    it('reads the folder and its tests again when asked', async () => {
      const result = await listedView();

      act(() => {
        result.current.onReload();
      });

      expect(result.current.isListing).toBe(true);
      await waitFor(() => {
        expect(result.current.isListing).toBe(false);
      });
      expect(listings).toBe(2);
    });

    it('says why the tests could not be read, with what Playwright said', async () => {
      listed = { kind: 'failed', reason: 'unreadable', said: 'SyntaxError: x.spec.ts' };

      const { result } = renderHook(() => useAutomationViewModel());

      await waitFor(() => {
        expect(result.current.listView).toBe('failed');
      });
      expect(result.current.failure).toEqual({
        text: 'Playwright could not read the suite:',
        said: 'SyntaxError: x.spec.ts',
      });
    });

    it('says when Playwright found no test at all', async () => {
      listed = { kind: 'listed', tests: [], projects: [] };

      const { result } = renderHook(() => useAutomationViewModel());

      await waitFor(() => {
        expect(result.current.listView).toBe('empty');
      });
    });

    it('opens the suite settings in the project window', () => {
      renderHook(() => useAutomationViewModel()).result.current.onSettings();

      expect(useAppStore.getState()).toMatchObject({
        modal: 'project',
        editingProjectId: 'p1',
        projectSection: 'automation',
      });
    });
  });

  describe('connecting', () => {
    beforeEach(() => {
      useSuiteStore.setState({ suites: {} });
    });

    it('connects the folder the QA picks, then reads its tests', async () => {
      const { result } = renderHook(() => useAutomationViewModel());

      expect(result.current.hasSuite).toBe(false);

      act(() => {
        result.current.onConnect();
      });

      await waitFor(() => {
        expect(result.current.listView).toBe('tree');
      });
      expect(result.current.hasSuite).toBe(true);
    });

    it('says a folder with no Playwright config is not a suite', async () => {
      pick = { kind: 'failed', reason: 'no-playwright' };

      const { result } = renderHook(() => useAutomationViewModel());

      act(() => {
        result.current.onConnect();
      });

      await waitFor(() => {
        expect(result.current.connect.refused).toBe(
          'That folder has no Playwright config. Pick the folder at the root of the suite.',
        );
      });
    });
  });

  describe('running', () => {
    it('runs the whole suite a project at a time, as the next run', async () => {
      useSuiteStore.setState({ runs: { p1: [suiteRun({ id: 's-04' })] } });

      const result = await listedView();

      result.current.onRunAll();

      expect(started).toEqual([
        {
          projectId: 'p1',
          runId: 's-05',
          batches: [
            { project: 'chromium', filters: [] },
            { project: 'salva-versao', filters: [] },
          ],
          expected: 3,
        },
      ]);
    });

    it('runs a folder, a file and a test by where they are written', async () => {
      const result = await listedView();

      result.current.tree.onRunPath('tests/hc-1');
      result.current.tree.onRunPath('tests/hc-2/ct-save.spec.ts');
      result.current.tree.onRunTest('cart');

      expect(started.map(({ expected }) => expected)).toEqual([2, 1, 1]);
      expect(started.map(({ batches }) => batches)).toEqual([
        [
          {
            project: 'chromium',
            filters: ['tests/hc-1/ct-nav.spec.ts', 'tests/hc-1/ct-cart.spec.ts'],
          },
        ],
        [{ project: 'salva-versao', filters: ['tests/hc-2/ct-save.spec.ts'] }],
        [{ project: 'chromium', filters: ['tests/hc-1/ct-cart.spec.ts:8'] }],
      ]);
    });

    /** A search narrows the tree, and a run takes what the QA sees, never what the search hid. */
    it('runs only the tests a search shows', async () => {
      const result = await listedView();

      act(() => {
        result.current.onSearch({ target: { value: 'carrinho' } } as never);
      });

      expect(result.current.runAllLabel).toBe('Run the test found');

      result.current.onRunAll();
      result.current.tree.onRunPath('tests/hc-1');

      expect(started.map(({ batches }) => batches)).toEqual([
        [{ project: 'chromium', filters: ['tests/hc-1/ct-cart.spec.ts:8'] }],
        [{ project: 'chromium', filters: ['tests/hc-1/ct-cart.spec.ts:8'] }],
      ]);
    });

    it('says a search that found nothing', async () => {
      const result = await listedView();

      act(() => {
        result.current.onSearch({ target: { value: 'checkout' } } as never);
      });

      expect(result.current).toMatchObject({
        listView: 'nothing',
        nothingFoundText: 'No test holds “checkout”.',
        canRunAll: false,
      });
    });

    it('runs again what failed last, and only that', async () => {
      useSuiteStore.setState({
        runs: {
          p1: [
            suiteRun({
              id: 's-01',
              results: [
                suiteResult({ testId: 'nav', status: 'timedOut' }),
                suiteResult({ testId: 'cart' }),
              ],
            }),
          ],
        },
      });

      const result = await listedView();

      expect(result.current).toMatchObject({ hasFailed: true, failedCount: 1 });

      result.current.onRunFailed();

      expect(started[0]?.batches).toEqual([
        { project: 'chromium', filters: ['tests/hc-1/ct-nav.spec.ts:5'] },
      ]);
    });

    it('does NOT start a run while one goes, and stops the one going', async () => {
      useSuiteStore.setState({
        runs: {
          p1: [suiteRun({ id: 's-01', status: 'running', endedAt: null, total: 3 })],
        },
        live: { p1: { runId: 's-01', going: { nav: 'Abrir o menu' } } },
      });

      const result = await listedView();

      result.current.onRunAll();
      result.current.tree.onRunTest('cart');
      result.current.onStop();

      expect(started).toEqual([]);
      expect(stopped).toEqual(['p1']);
      expect(result.current).toMatchObject({ isRunning: true, canRun: false });
    });

    it('does NOT run a suite whose packages are not installed', async () => {
      useSuiteStore.setState({ suites: { p1: { ...SUITE, version: null } } });

      const result = await listedView();

      result.current.onRunAll();

      expect(started).toEqual([]);
      expect(result.current).toMatchObject({
        runner: 'packages not installed',
        runnerClassName: 'automation__fact automation__fact--attn',
      });
    });
  });

  describe('progress', () => {
    it('counts the tests done of the run going, and those that failed', async () => {
      useSuiteStore.setState({
        runs: {
          p1: [
            suiteRun({
              id: 's-02',
              status: 'running',
              endedAt: null,
              total: 4,
              results: [
                suiteResult({ testId: 'nav' }),
                suiteResult({ testId: 'cart', status: 'failed' }),
              ],
            }),
          ],
        },
        live: { p1: { runId: 's-02', going: { save: null } } },
      });

      const result = await listedView();

      expect(result.current.progress).toMatchObject({
        label: '2 of 4',
        failed: '1 failed',
        style: { '--suite-done': '0.5' },
      });
      expect(result.current.lastRun).toBeNull();
    });

    it('tallies how the last run went once it ended', async () => {
      useSuiteStore.setState({
        runs: {
          p1: [
            suiteRun({
              id: 's-03',
              endedAt: new Date(2026, 9, 21, 14, 5).getTime(),
              results: [
                suiteResult({ testId: 'nav' }),
                suiteResult({ testId: 'cart', status: 'passed', isFlaky: true }),
                suiteResult({ testId: 'save', status: 'failed' }),
              ],
            }),
          ],
        },
      });

      const result = await listedView();

      expect(result.current.progress).toBeNull();
      expect(result.current.lastRun).toMatchObject({
        facts: 's-03 · Oct 21, 14:05',
        tallies: [
          { key: 'passed', count: 1 },
          { key: 'flaky', count: 1 },
          { key: 'failed', count: 1 },
        ],
      });
    });

    it('says a run that broke, with what Playwright said', async () => {
      useSuiteStore.setState({
        runs: { p1: [suiteRun({ status: 'broke', said: 'Error: no tests found' })] },
      });

      const result = await listedView();

      expect(result.current.notice).toEqual({
        text: 'The run broke before its tests could tell:',
        said: 'Error: no tests found',
      });
    });
  });

  describe('the tree and the pane', () => {
    it('folds a folder and opens it again', async () => {
      const result = await listedView();

      act(() => {
        result.current.tree.onToggle('tests/hc-1');
      });

      expect(result.current.tree.shut).toEqual(['tests/hc-1']);

      act(() => {
        result.current.tree.onToggle('tests/hc-1');
      });

      expect(result.current.tree.shut).toEqual([]);
    });

    it('asks for a test until one is picked, then shows it with the step it is on', async () => {
      useSuiteStore.setState({
        runs: { p1: [suiteRun({ id: 's-01', status: 'running', endedAt: null })] },
        live: { p1: { runId: 's-01', going: { cart: 'Abrir o carrinho' } } },
      });

      const result = await listedView();

      expect(result.current.pane).toBeNull();

      act(() => {
        result.current.tree.onPick('cart');
      });

      expect(result.current.pane).toMatchObject({
        key: 'cart',
        test: { title: 'CT-CART-001 · Abre o carrinho' },
        step: 'Abrir o carrinho',
        isRunning: true,
        hasProjects: true,
      });
    });
  });

  describe('fixing a test that broke', () => {
    const BROKE = {
      p1: [
        suiteRun({
          id: 's-04',
          status: 'failed',
          results: [suiteResult({ testId: 'cart', status: 'failed' })],
        }),
      ],
    };
    const FIX = (props: Partial<ISuiteChange>) =>
      ({
        id: 'c-01',
        projectId: 'p1',
        startedAt: 1,
        status: 'working',
        step: 'agent',
        base: 'main',
        ask: { kind: 'fix', test: CART, runId: 's-04' },
        ...props,
      }) as ISuiteChange;

    async function pickCart() {
      const result = await listedView();

      act(() => {
        result.current.tree.onPick('cart');
      });

      return result;
    }

    beforeEach(() => {
      useSuiteStore.setState({ runs: BROKE });
    });

    it('offers the agent a test that broke in a suite git keeps', async () => {
      const result = await pickCart();

      expect(result.current.pane?.fix).toEqual({
        canFix: true,
        note: 'On a branch of its own: you review the change before it leaves your machine.',
      });
    });

    it('asks the agent to fix it, with the test, the run it broke in and the projects', async () => {
      const result = await pickCart();

      result.current.pane?.onFix();

      expect(fixes).toEqual([
        {
          projectId: 'p1',
          changeId: 'c-01',
          agentId: 'claude-code',
          model: 'haiku',
          language: 'pt',
          projects: ['chromium', 'salva-versao'],
          ask: { kind: 'fix', test: CART, runId: 's-04' },
        },
      ]);
    });

    it('offers no fix for a test that passed', async () => {
      useSuiteStore.setState({
        runs: { p1: [suiteRun({ results: [suiteResult({ testId: 'cart' })] })] },
      });

      expect((await pickCart()).current.pane?.fix).toBeNull();
    });

    it('does NOT start a fix in a folder git does not keep, and says why', async () => {
      useSuiteStore.setState({ suites: { p1: { ...SUITE, branch: null } } });

      const result = await pickCart();

      result.current.pane?.onFix();

      expect(result.current.pane?.fix).toEqual({
        canFix: false,
        note: "The suite's folder is not a git repository, so there is no branch to fix it on.",
      });
      expect(fixes).toEqual([]);
    });

    it('does NOT start a fix while the agent fixes another test of the suite', async () => {
      useSuiteStore.setState({
        changes: { p1: [FIX({ ask: { kind: 'fix', test: NAV, runId: 's-04' } })] },
      });

      const result = await pickCart();

      result.current.pane?.onFix();

      expect(result.current.pane?.fix).toMatchObject({
        canFix: false,
        note: 'The agent is fixing another test of this suite.',
      });
      expect(fixes).toEqual([]);
    });

    it('shows the fix under way in place of the offer, with what the agent says', async () => {
      useSuiteStore.setState({
        changes: { p1: [FIX({})] },
        changeNotes: { 'c-01': [{ id: 1, kind: 'said', text: 'Read ./tests' }] },
      });

      const result = await pickCart();

      expect(result.current.pane).toMatchObject({
        fix: null,
        change: { id: 'c-01', status: 'working' },
        notes: [{ id: 1, kind: 'said', text: 'Read ./tests' }],
        agent: 'Claude Code',
      });
    });

    it('opens a fix ready to review, with the pull request when GitHub is connected', async () => {
      useSuiteStore.setState({ changes: { p1: [FIX({ status: 'ready', step: null })] } });
      useSetupStore.setState({
        integrations: [{ id: 'github', account: 'qa', connectedAt: 1 }] as never,
      });

      const result = await pickCart();

      expect(result.current.review).toBeNull();

      act(() => {
        result.current.pane?.onReview();
      });

      expect(result.current.review).toMatchObject({
        change: { id: 'c-01' },
        canOpenPullRequest: true,
      });

      act(() => {
        result.current.onCloseReview();
      });

      expect(result.current.review).toBeNull();
    });

    it('sends the branch alone when GitHub is not connected', async () => {
      useSuiteStore.setState({ changes: { p1: [FIX({ status: 'ready', step: null })] } });

      const result = await pickCart();

      act(() => {
        result.current.pane?.onReview();
      });

      expect(result.current.review?.canOpenPullRequest).toBe(false);
    });
  });
});
