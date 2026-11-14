// @vitest-environment jsdom
import type { IStepOutcome } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useManualPanelViewModel } from '@/modules/Device/components/DeviceView/components/ManualPanel/hooks/useManualPanelViewModel';
import { startRun } from '@/modules/Workspace';
import { makeWorkspace, WALKED_BY } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useVariablesStore, useWorkspaceStore } from '@/store';

/** O TC-01 à mão, com a vez do QA já aberta depois de o agente o preparar. */
function qaTurn(outcomes: IStepOutcome[] = []) {
  const workspace = makeWorkspace();
  const started = startRun({
    workspace: {
      ...workspace,
      plan: workspace.plan.map((one) =>
        one.id === 'TC-01'
          ? { ...one, isManual: true, preconditions: 'Signed in, on order 1042' }
          : one,
      ),
    },
    startedAt: '09:41',
    runId: 'r-01',
    by: WALKED_BY,
    caseIds: ['TC-01'],
    mode: 'manual',
  });

  useWorkspaceStore.setState({
    workspaces: [
      {
        ...started,
        live:
          started.live === null
            ? null
            : {
                ...started.live,
                how: 'manual',
                manual: { caseId: 'TC-01', prep: 'agent' },
                outcomes,
              },
      },
    ],
  });
}

const marked = (stepNumber: number): IStepOutcome => ({
  workspaceId: 'w1',
  caseId: 'TC-01',
  stepNumber,
  index: stepNumber - 1,
  action: '',
  expected: '',
  verdict: 'passed',
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

let calls: { kind: string; value: unknown }[] = [];

beforeEach(async () => {
  await i18n.changeLanguage('en');
  calls = [];
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useVariablesStore.setState({
    byProject: { p1: [{ name: 'SEND_TO', description: 'Where invoices go' }] },
  });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    markRun: vi.fn((mark) => {
      calls.push({ kind: 'mark', value: mark });

      return Promise.resolve();
    }),
    typeRunVariable: vi.fn((props) => {
      calls.push({ kind: 'variable', value: props });

      return Promise.resolve(true);
    }),
    endManual: vi.fn((workspaceId) => {
      calls.push({ kind: 'end', value: workspaceId });

      return Promise.resolve();
    }),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useManualPanelViewModel', () => {
  it('shows how the case was prepared and the step the QA is on, with what is expected', () => {
    qaTurn([marked(1)]);

    const { result } = renderHook(() => useManualPanelViewModel());

    expect(result.current.title).toBe('Your turn on TC-01');
    expect(result.current.prep).toBe('The agent prepared it: Signed in, on order 1042');
    expect(
      result.current.steps.map(({ number, status, isNow }) => [number, status, isNow]),
    ).toEqual([
      [1, 'passed', false],
      [2, 'running', true],
      [3, 'pending', false],
    ]);
  });

  it('marks the step with the QA’s note, and does NOT mark it twice before it lands', () => {
    qaTurn();

    const { result } = renderHook(() => useManualPanelViewModel());

    act(() => {
      result.current.onNote('The total shows twice');
    });
    act(() => {
      result.current.onFailed();
    });
    act(() => {
      result.current.onPassed();
    });

    expect(calls).toEqual([
      {
        kind: 'mark',
        value: { workspaceId: 'w1', verdict: 'failed', note: 'The total shows twice' },
      },
    ]);
    expect(result.current).toMatchObject({ note: '', canMark: false });
  });

  it('types a variable by its name, never its value, and ends the case', () => {
    qaTurn();

    const { result } = renderHook(() => useManualPanelViewModel());

    expect(result.current.variables.map(({ name }) => name)).toEqual(['${SEND_TO}']);

    act(() => {
      result.current.onPickVariable();
    });

    expect(result.current.isPicking).toBe(true);

    act(() => {
      result.current.variables[0]?.onPick();
      result.current.onEnd();
    });

    expect(calls).toEqual([
      { kind: 'variable', value: { workspaceId: 'w1', name: 'SEND_TO' } },
      { kind: 'end', value: 'w1' },
    ]);
  });
});
