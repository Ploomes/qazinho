// @vitest-environment jsdom
import type { ISuiteTestPaneProps } from '@/modules/Automation/screens/Automation/components/SuiteTestPane/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  suiteResult,
  suiteRun,
  suiteTest,
} from '@/modules/Automation/library/__tests__/fixtures';
import { useSuiteTestPaneViewModel } from '@/modules/Automation/screens/Automation/components/SuiteTestPane/hooks/useSuiteTestPaneViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore } from '@/store';

const TEST = suiteTest({
  id: 'nav-2',
  file: 'tests/hc-1139/ct-nav.spec.ts',
  line: 30,
  path: ['CT-NAV · Navegação', 'carrinho'],
  title: 'CT-NAV-002 · Abre o carrinho',
  tags: ['altera-dados'],
  project: 'salva-versao',
});
const FAILED = suiteRun({
  id: 's-03',
  endedAt: new Date(2026, 9, 21, 14, 5).getTime(),
  status: 'failed',
  results: [
    suiteResult({
      testId: 'nav-2',
      status: 'failed',
      durationMs: 4_250,
      error: 'TimeoutError: locator.click',
      attachments: [
        {
          name: 'screenshot',
          contentType: 'image/png',
          file: 'output/0/nav-2/test-failed-1.png',
          url: 'http://127.0.0.1:5000/t/suite/p-1/s-03/output/0/nav-2/test-failed-1.png',
        },
        {
          name: 'video',
          contentType: 'video/webm',
          file: 'output/0/nav-2/video.webm',
          url: 'http://127.0.0.1:5000/t/suite/p-1/s-03/output/0/nav-2/video.webm',
        },
        {
          name: 'trace',
          contentType: 'application/zip',
          file: 'output/0/nav-2/trace.zip',
          url: 'http://127.0.0.1:5000/t/suite/p-1/s-03/output/0/nav-2/trace.zip',
        },
      ],
    }),
  ],
});
const PASSED = suiteRun({
  id: 's-02',
  endedAt: new Date(2026, 9, 20, 9, 10).getTime(),
  results: [suiteResult({ testId: 'nav-2', durationMs: 900 })],
});
const OTHER = suiteRun({
  id: 's-01',
  results: [suiteResult({ testId: 'nav-1' })],
});

let traces: { projectId: string; runId: string; file: string }[] = [];

beforeEach(() => {
  traces = [];
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    openSuiteTrace: (ref) => {
      traces.push(ref);

      return Promise.resolve(true);
    },
  };
  useAppStore.setState({ media: null });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

function render(props: Partial<ISuiteTestPaneProps> = {}) {
  const onRun = vi.fn();
  const onFix = vi.fn();
  const view = renderHook(() =>
    useSuiteTestPaneViewModel({
      projectId: 'p-1',
      test: TEST,
      runs: [FAILED, PASSED, OTHER],
      step: null,
      isRunning: false,
      canRun: true,
      hasProjects: true,
      fix: null,
      change: null,
      notes: [],
      agent: 'Claude Code',
      onRun,
      onFix,
      onStopFix: vi.fn(),
      onReview: vi.fn(),
      onDiscard: vi.fn(),
      ...props,
    }),
  );

  return { onRun, onFix, result: view.result };
}

describe('useSuiteTestPaneViewModel', () => {
  describe('the test', () => {
    it('says where the test is written, inside which describes, in which project', () => {
      expect(render().result.current).toMatchObject({
        trail: 'CT-NAV · Navegação · carrinho',
        title: 'CT-NAV-002 · Abre o carrinho',
        where: 'tests/hc-1139/ct-nav.spec.ts:30',
        project: 'salva-versao',
        tags: ['@altera-dados'],
      });
    });

    it('leaves the project out in a config that declares none', () => {
      expect(render({ hasProjects: false }).result.current.project).toBe('');
    });
  });

  describe('onRun', () => {
    it('runs the test by its id', () => {
      const { onRun, result } = render();

      result.current.onRun();

      expect(onRun).toHaveBeenCalledWith('nav-2');
    });

    it('does NOT run the test again while it runs, nor a suite that cannot run', () => {
      for (const props of [{ isRunning: true }, { canRun: false }]) {
        const { onRun, result } = render(props);

        result.current.onRun();

        expect(onRun).not.toHaveBeenCalled();
        expect(result.current.canRun).toBe(false);
      }
    });
  });

  describe('result', () => {
    it('shows the latest run that reached the test, with its error', () => {
      expect(render().result.current.result).toMatchObject({
        key: 's-03',
        icon: 'failed',
        word: 'failed',
        stateClassName: 'suite-test-pane__state suite-test-pane__state--fail',
        facts: 's-03 · 4.3 s · Oct 21, 14:05',
        error: 'TimeoutError: locator.click',
        shotClassName: 'suite-test-pane__shot suite-test-pane__shot--bad',
      });
    });

    it('lays out the screens and the video the test left', () => {
      const result = render().result.current.result;

      expect(result?.shots).toMatchObject([
        {
          label: 'Screenshot',
          src: 'http://127.0.0.1:5000/t/suite/p-1/s-03/output/0/nav-2/test-failed-1.png',
        },
      ]);
      expect(result?.videos).toMatchObject([
        { src: 'http://127.0.0.1:5000/t/suite/p-1/s-03/output/0/nav-2/video.webm' },
      ]);
    });

    it('opens a screen in the lightbox, named after the test', () => {
      render().result.current.result?.shots[0]?.onOpen();

      expect(useAppStore.getState().media).toEqual({
        kicker: 'Screenshot',
        title: 'CT-NAV-002 · Abre o carrinho',
        src: 'http://127.0.0.1:5000/t/suite/p-1/s-03/output/0/nav-2/test-failed-1.png',
        file: null,
      });
    });

    it("opens the trace in Playwright's viewer, by the run and the file", () => {
      render().result.current.result?.trace?.onOpen();

      expect(traces).toEqual([
        { projectId: 'p-1', runId: 's-03', file: 'output/0/nav-2/trace.zip' },
      ]);
    });

    it('offers no trace for a run that left none', () => {
      expect(render({ runs: [PASSED] }).result.current.result?.trace).toBeNull();
    });

    it('says a test no run reached was never run here', () => {
      expect(render({ runs: [OTHER] }).result.current).toMatchObject({
        result: null,
        isNeverRun: true,
      });
    });

    /** The step it is on says more than "never run" while the first run reaches it. */
    it('does NOT say never run while the test runs', () => {
      expect(
        render({ runs: [], isRunning: true, step: 'Abrir o menu' }).result.current,
      ).toMatchObject({ isNeverRun: false, isRunning: true, step: 'Abrir o menu' });
    });
  });

  describe('fix', () => {
    it('offers the agent a test that broke, saying how it goes', () => {
      const { result, onFix } = render({
        fix: { canFix: true, note: 'On a branch of its own.' },
      });

      expect(result.current.fix).toMatchObject({
        canFix: true,
        label: 'Fix with the agent',
        note: 'On a branch of its own.',
      });

      result.current.fix?.onFix();

      expect(onFix).toHaveBeenCalledOnce();
    });

    it('offers no fix for a test that did not break', () => {
      expect(render().result.current.fix).toBeNull();
    });

    it('tries the same fix again from the card', () => {
      const { result, onFix } = render();

      result.current.onRetry();

      expect(onFix).toHaveBeenCalledOnce();
    });
  });

  describe('history', () => {
    it('lists each run that reached the test, the latest first, the one shown marked', () => {
      const { history, hasHistory } = render().result.current;

      expect(hasHistory).toBe(true);
      expect(history).toMatchObject([
        { runId: 's-03', word: 'failed', isShown: true },
        { runId: 's-02', word: 'passed', duration: '900 ms', isShown: false },
      ]);
    });

    it('shows an older run once the QA picks it', () => {
      const { result } = render();

      act(() => {
        result.current.history[1]?.onShow();
      });

      expect(result.current.result).toMatchObject({
        key: 's-02',
        word: 'passed',
        error: null,
        shotClassName: 'suite-test-pane__shot',
        trace: null,
      });
      expect(result.current.history[1]?.className).toBe(
        'suite-test-pane__run suite-test-pane__run--shown',
      );
    });

    it('says no duration of a run that skipped the test', () => {
      const skipped = suiteRun({
        id: 's-04',
        results: [suiteResult({ testId: 'nav-2', status: 'skipped', durationMs: 0 })],
      });

      expect(
        render({ runs: [skipped] }).result.current.result?.facts.startsWith('s-04 · '),
      ).toBe(true);
      expect(render({ runs: [skipped] }).result.current.result?.facts).not.toContain(
        'ms',
      );
    });

    it('keeps no list for a test that ran once', () => {
      expect(render({ runs: [PASSED] }).result.current.hasHistory).toBe(false);
    });
  });
});
