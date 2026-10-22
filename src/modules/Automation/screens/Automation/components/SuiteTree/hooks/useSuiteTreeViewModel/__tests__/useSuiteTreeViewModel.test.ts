// @vitest-environment jsdom
import type { ISuiteTreeProps } from '@/modules/Automation/screens/Automation/components/SuiteTree/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { suiteResult, suiteTest } from '@/modules/Automation/library/__tests__/fixtures';
import { useSuiteTreeViewModel } from '@/modules/Automation/screens/Automation/components/SuiteTree/hooks/useSuiteTreeViewModel';

const NAV = suiteTest({ id: 'nav-1', title: 'CT-NAV-001 · Abre a lista', line: 10 });
const NAV_2 = suiteTest({
  id: 'nav-2',
  title: 'CT-NAV-002 · Abre o carrinho',
  line: 30,
  tags: ['altera-dados'],
  project: 'salva-versao',
});
const ROOT = suiteTest({ id: 'root', file: 'login.spec.ts', title: 'Entra' });

function render(props: Partial<ISuiteTreeProps> = {}) {
  const handlers = {
    onToggle: vi.fn(),
    onPick: vi.fn(),
    onRunPath: vi.fn(),
    onRunTest: vi.fn(),
  };
  const view = renderHook(() =>
    useSuiteTreeViewModel({
      folders: [
        {
          path: 'tests/hc-1139',
          name: 'hc-1139',
          files: [
            {
              path: 'tests/hc-1139/ct-nav.spec.ts',
              name: 'ct-nav.spec.ts',
              tests: [NAV, NAV_2],
            },
          ],
        },
        {
          path: '',
          name: '',
          files: [{ path: 'login.spec.ts', name: 'login.spec.ts', tests: [ROOT] }],
        },
      ],
      last: {},
      going: {},
      pickedId: null,
      shut: [],
      isQuerying: false,
      canRun: true,
      ...handlers,
      ...props,
    }),
  );

  return { ...handlers, folders: view.result.current.folders };
}

describe('useSuiteTreeViewModel', () => {
  describe('folders', () => {
    it('names each folder with how many tests it holds, the root of the suite as /', () => {
      const [story, root] = render().folders;

      expect(story).toMatchObject({ name: 'hc-1139', count: '2 tests', isOpen: true });
      expect(root).toMatchObject({ name: '/', count: '1 test' });
    });

    /** A pass on a retry still passed, and the tally counts it there; the row itself says flaky. */
    it('tallies how its tests went last, a flaky pass with the passes', () => {
      const [story] = render({
        last: {
          'nav-1': {
            result: suiteResult({ testId: 'nav-1', isFlaky: true }),
            runId: 's-01',
            endedAt: 9,
          },
          'nav-2': {
            result: suiteResult({ testId: 'nav-2', status: 'failed' }),
            runId: 's-01',
            endedAt: 9,
          },
        },
      }).folders;

      expect(story).toMatchObject({ passed: 1, failed: 1 });
    });

    it('keeps a folder the QA shut folded, unless a search is showing what it holds', () => {
      expect(render({ shut: ['tests/hc-1139'] }).folders[0]?.isOpen).toBe(false);
      expect(
        render({ shut: ['tests/hc-1139'], isQuerying: true }).folders[0]?.isOpen,
      ).toBe(true);
    });

    it('folds a folder and runs what it holds, by its path', () => {
      const { folders, onToggle, onRunPath } = render();

      folders[0]?.onToggle();
      folders[0]?.onRun();
      folders[0]?.files[0]?.onRun();

      expect(onToggle).toHaveBeenCalledWith('tests/hc-1139');
      expect(onRunPath.mock.calls).toEqual([
        ['tests/hc-1139'],
        ['tests/hc-1139/ct-nav.spec.ts'],
      ]);
    });

    it('offers no run while the suite cannot run', () => {
      expect(render({ canRun: false }).folders[0]?.canRun).toBe(false);
    });
  });

  describe('tests', () => {
    it('shows a test never run here as not run, with no duration', () => {
      const test = render().folders[0]?.files[0]?.tests[0];

      expect(test).toMatchObject({
        title: 'CT-NAV-001 · Abre a lista',
        icon: 'pending',
        stateWord: 'not run',
        stateClassName: 'suite-tree__state suite-tree__state--quiet',
        duration: '',
        step: null,
      });
    });

    it('shows how a test went last, and how long it took', () => {
      const test = render({
        last: {
          'nav-2': {
            result: suiteResult({ testId: 'nav-2', status: 'failed', durationMs: 4_250 }),
            runId: 's-02',
            endedAt: 9,
          },
        },
      }).folders[0]?.files[0]?.tests[1];

      expect(test).toMatchObject({
        icon: 'failed',
        stateClassName: 'suite-tree__state suite-tree__state--fail',
        duration: '4.3 s',
        tags: ['@altera-dados'],
        project: '',
      });
    });

    it('shows a running test with the step it is on, and no duration yet', () => {
      const test = render({
        going: { 'nav-1': 'Abrir o menu' },
        last: {
          'nav-1': {
            result: suiteResult({ testId: 'nav-1' }),
            runId: 's-01',
            endedAt: 9,
          },
        },
      }).folders[0]?.files[0]?.tests[0];

      expect(test).toMatchObject({
        icon: 'running',
        stateClassName: 'suite-tree__state suite-tree__state--lime',
        step: 'Abrir o menu',
        duration: '',
      });
    });

    /** A config that runs a spec in two browsers lists it twice; only then does the project tell the rows apart. */
    it('names the project only of a test the config runs in more than one', () => {
      const twice = suiteTest({ ...NAV, id: 'nav-1-firefox', project: 'firefox' });
      const tests = render({
        folders: [
          {
            path: 'tests/hc-1139',
            name: 'hc-1139',
            files: [
              {
                path: 'tests/hc-1139/ct-nav.spec.ts',
                name: 'ct-nav.spec.ts',
                tests: [NAV, twice, NAV_2],
              },
            ],
          },
        ],
      }).folders[0]?.files[0]?.tests;

      expect(tests?.map(({ project }) => project)).toEqual(['chromium', 'firefox', '']);
    });

    it('shows no duration for a test that was skipped', () => {
      const test = render({
        last: {
          'nav-1': {
            result: suiteResult({ testId: 'nav-1', status: 'skipped', durationMs: 0 }),
            runId: 's-01',
            endedAt: 9,
          },
        },
      }).folders[0]?.files[0]?.tests[0];

      expect(test).toMatchObject({ icon: 'skipped', duration: '' });
    });

    it('marks the test picked', () => {
      const tests = render({ pickedId: 'nav-2' }).folders[0]?.files[0]?.tests ?? [];

      expect(tests.map((test) => test.className)).toEqual([
        'suite-tree__test',
        'suite-tree__test suite-tree__test--picked',
      ]);
    });

    it('picks and runs a test by its id', () => {
      const { folders, onPick, onRunTest } = render();
      const test = folders[0]?.files[0]?.tests[1];

      test?.onPick();
      test?.onRun();

      expect(onPick).toHaveBeenCalledWith('nav-2');
      expect(onRunTest).toHaveBeenCalledWith('nav-2');
    });
  });
});
