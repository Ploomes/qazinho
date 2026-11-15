// @vitest-environment jsdom
import type { IStepOutcome } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useManualDockViewModel } from '@/modules/Device/screens/ManualDock/hooks/useManualDockViewModel';
import { startRun } from '@/modules/Workspace';
import { makeWorkspace, WALKED_BY } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useVariablesStore, useWorkspaceStore } from '@/store';

/** O TC-01 à mão num plano aberto: o agente preparando, a vez do QA, ou o caso feito. */
function manualRun(props: {
  phase: 'preparing' | 'turn' | 'done';
  outcomes?: IStepOutcome[];
}) {
  const workspace = makeWorkspace();
  const started = startRun({
    workspace: {
      ...workspace,
      plan: workspace.plan.map((one) =>
        one.id === 'TC-01' ? { ...one, isManual: true } : one,
      ),
    },
    startedAt: '09:41',
    runId: 'r-01',
    by: WALKED_BY,
    caseIds: ['TC-01'],
    mode: 'manual',
  });

  if (started.live === null) throw new Error('the run did not start');

  useWorkspaceStore.setState({
    workspaces: [
      {
        ...started,
        live: {
          ...started.live,
          outcomes: props.outcomes ?? [],
          isDone: props.phase === 'done',
          ...(props.phase === 'preparing'
            ? {}
            : {
                how: 'manual' as const,
                manual: { caseId: 'TC-01', prep: 'agent' as const },
              }),
        },
      },
    ],
  });
}

const marked = (stepNumber: number, verdict: 'passed' | 'failed'): IStepOutcome => ({
  workspaceId: 'w1',
  caseId: 'TC-01',
  stepNumber,
  index: stepNumber - 1,
  action: '',
  expected: '',
  verdict,
  why: '',
  got: '',
  title: '',
  severity: 'medium',
  tookMs: 0,
  at: 0,
  screenshot: null,
  shotFile: null,
  by: 'qa',
});

let marks: unknown[] = [];
let stops: string[] = [];

function bridge(platform: 'darwin' | 'win32') {
  window.qazinho = {
    ...fakeQazinhoApi(platform),
    markRun: vi.fn((mark) => {
      marks.push(mark);

      return Promise.resolve();
    }),
    stopRun: vi.fn((workspaceId: string) => {
      stops.push(workspaceId);

      return Promise.resolve();
    }),
  };
}

const press = (init: KeyboardEventInit) => {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ...init }));
  });
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
  marks = [];
  stops = [];
  useAppStore.setState({
    selectedWorkspaceId: 'w1',
    projects: [{ id: 'p1', name: 'Shop', targets: [], repositories: [] }],
  });
  useVariablesStore.setState({ byProject: {} });
  useWorkspaceStore.setState({ activities: {} });
  bridge('darwin');
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useManualDockViewModel', () => {
  it('says the agent is setting up the case, with every step still to do', () => {
    manualRun({ phase: 'preparing' });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current).toMatchObject({
      isPreparing: true,
      isTurn: false,
      stateLabel: 'Setting up the case',
      mood: 'running',
      caseId: 'TC-01',
      projectName: 'Shop',
      line: 'The case is being set up in the Chrome on the left. Your turn comes next.',
      progressLabel: '0 of 3',
    });
    expect(result.current.steps.map(({ status, isNow }) => [status, isNow])).toEqual([
      ['pending', false],
      ['pending', false],
      ['pending', false],
    ]);
  });

  it('stops the run while the agent is still setting it up', () => {
    manualRun({ phase: 'preparing' });

    const { result } = renderHook(() => useManualDockViewModel());

    act(() => {
      result.current.onStop();
    });

    expect(stops).toEqual(['w1']);
  });

  it('shows the QA’s turn on the first step not marked, and how far it went', () => {
    manualRun({ phase: 'turn', outcomes: [marked(1, 'passed')] });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current).toMatchObject({
      isTurn: true,
      stateLabel: 'Your turn',
      mood: 'thinking',
      progressLabel: '1 of 3',
      progressValue: 1,
      progressMax: 3,
      canMark: true,
    });
    expect(
      result.current.steps.map(({ status, isNow, className }) => [
        status,
        isNow,
        className,
      ]),
    ).toEqual([
      ['passed', false, 'manual-dock__step manual-dock__step--marked'],
      ['running', true, 'manual-dock__step manual-dock__step--now'],
      ['pending', false, 'manual-dock__step'],
    ]);
    expect(result.current.progressStyle).toMatchObject({
      '--dock-progress': String(1 / 3),
    });
  });

  it('marks the step with ⌘↵ and fails it with ⌘⇧↵ on a Mac', () => {
    manualRun({ phase: 'turn' });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current).toMatchObject({ passedKeys: '⌘↵', failedKeys: '⌘⇧↵' });

    press({ metaKey: true });

    expect(marks).toEqual([{ workspaceId: 'w1', verdict: 'passed', note: '' }]);
  });

  it('fails the step with the shift held', () => {
    manualRun({ phase: 'turn' });

    renderHook(() => useManualDockViewModel());
    press({ metaKey: true, shiftKey: true });

    expect(marks).toEqual([{ workspaceId: 'w1', verdict: 'failed', note: '' }]);
  });

  /** No Windows e no Linux o Ctrl faz o que o ⌘ faz, e o ⌘ sozinho não marca nada. */
  it('marks with Ctrl off a Mac, and NOT with the Windows key', () => {
    bridge('win32');
    manualRun({ phase: 'turn' });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current.passedKeys).not.toContain('⌘');

    press({ metaKey: true });

    expect(marks).toEqual([]);

    press({ ctrlKey: true });

    expect(marks).toEqual([{ workspaceId: 'w1', verdict: 'passed', note: '' }]);
  });

  it('does NOT mark anything with Enter alone, which the note field needs', () => {
    manualRun({ phase: 'turn' });

    renderHook(() => useManualDockViewModel());
    press({});

    expect(marks).toEqual([]);
  });

  it('does NOT mark while the agent is still setting the case up', () => {
    manualRun({ phase: 'preparing' });

    renderHook(() => useManualDockViewModel());
    press({ metaKey: true });

    expect(marks).toEqual([]);
  });

  /** O fim da run chega depois de a janela voltar: o caso feito aparece na última marca. */
  it('says the case is done as soon as the last step is marked', () => {
    manualRun({
      phase: 'turn',
      outcomes: [marked(1, 'passed'), marked(2, 'passed'), marked(3, 'passed')],
    });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current).toMatchObject({
      isDone: true,
      isTurn: false,
      stateLabel: 'Case done',
      mood: 'passed',
      line: '3 passed',
    });
  });

  /** Parar no preparo não é um caso feito: nada foi marcado. */
  it('says the run stopped when it ended before any step was marked', () => {
    manualRun({ phase: 'done' });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current).toMatchObject({
      isDone: true,
      stateLabel: 'Run stopped',
      mood: 'neutral',
      line: 'Back to QAzinho…',
    });
  });

  /** Terminar o caso sem marcar nada deixa os passos pulados: não é um caso feito. */
  it('says the case ended when no step passed or failed', () => {
    const skipped = (stepNumber: number): IStepOutcome => ({
      ...marked(stepNumber, 'passed'),
      verdict: 'skipped',
    });

    manualRun({ phase: 'done', outcomes: [skipped(1), skipped(2), skipped(3)] });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current).toMatchObject({
      stateLabel: 'Case ended',
      mood: 'neutral',
      line: '3 skipped',
    });
  });

  it('says how the case went once it is done', () => {
    manualRun({ phase: 'done', outcomes: [marked(1, 'passed'), marked(2, 'failed')] });

    const { result } = renderHook(() => useManualDockViewModel());

    expect(result.current).toMatchObject({
      isDone: true,
      stateLabel: 'Case done',
      mood: 'bug',
      line: '1 passed · 1 failed',
    });
  });
});
