// @vitest-environment jsdom
import type { IAppToolAnswer, IOutsideToolRequest } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOutsideCalls } from '@/modules/Outside/hooks/useOutsideCalls';
import { endRun, startRun } from '@/modules/Workspace/library';
import { makeWorkspace, WALKED_BY } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

let call: (request: IOutsideToolRequest) => void = () => undefined;
let answers: IAppToolAnswer[] = [];

const going = () =>
  startRun({
    workspace: makeWorkspace(),
    startedAt: '10:00',
    runId: 'r-01',
    by: WALKED_BY,
  });

beforeEach(() => {
  answers = [];
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    onOutsideToolCall: (listener) => {
      call = listener;

      return () => undefined;
    },
    answerAppTool: (answer) => {
      answers.push(answer);
    },
  };
  useAppStore.setState({
    isLoaded: true,
    projects: [{ id: 'p1', name: 'Loja', targets: [], repositories: [] }],
  });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useOutsideCalls', () => {
  it('answers a call with the id it came with, and leaves the screen alone', async () => {
    useAppStore.setState({ screen: 'welcome', selectedWorkspaceId: null });
    renderHook(() => {
      useOutsideCalls();
    });

    act(() => {
      call({ id: 'c-1', call: { name: 'list_workspaces', args: {} } });
    });

    await waitFor(() => {
      expect(answers[0]).toMatchObject({ id: 'c-1', isError: false });
    });
    expect(useAppStore.getState()).toMatchObject({
      screen: 'welcome',
      selectedWorkspaceId: null,
    });
  });

  it("takes an exploration's suggestion into the plan, as the QA's button does", async () => {
    useWorkspaceStore.setState({
      workspaces: [
        {
          ...makeWorkspace([]),
          chat: [
            {
              id: 'm-1',
              kind: 'suggestion',
              at: '10:00',
              runId: 'r-02',
              summary: 'What the exploration saw',
              cases: [
                {
                  title: 'Coupon',
                  priority: 'P1',
                  goal: '',
                  preconditions: '',
                  steps: [{ action: 'Apply the coupon', expected: 'The total drops' }],
                },
              ],
              isTaken: false,
            },
          ],
        },
      ],
    });
    renderHook(() => {
      useOutsideCalls();
    });

    act(() => {
      call({ id: 'c-2', call: { name: 'take_suggestion', args: { workspace: 'w1' } } });
    });

    await waitFor(() => {
      expect(answers).toHaveLength(1);
    });
    expect(useWorkspaceStore.getState().workspaces[0]?.plan).toHaveLength(1);
    expect(useWorkspaceStore.getState().workspaces[0]?.chat[0]).toMatchObject({
      isTaken: true,
    });
  });

  it('holds a status until the run ends, not for the whole wait', async () => {
    useWorkspaceStore.setState({ workspaces: [going()] });
    renderHook(() => {
      useOutsideCalls();
    });

    act(() => {
      call({
        id: 'c-3',
        call: { name: 'run_status', args: { workspace: 'w1', waitSeconds: 50 } },
      });
    });

    expect(answers).toEqual([]);

    act(() => {
      useWorkspaceStore.setState({
        workspaces: [endRun({ workspace: going(), at: '10:05', endedBy: 'finished' })],
      });
    });

    await waitFor(() => {
      expect(answers[0]?.id).toBe('c-3');
    });
    expect(answers[0]?.text).not.toContain('still going on');
  });

  it('stops holding when the wait is over, with the run still going', async () => {
    vi.useFakeTimers();
    useWorkspaceStore.setState({ workspaces: [going()] });
    renderHook(() => {
      useOutsideCalls();
    });

    act(() => {
      call({
        id: 'c-4',
        call: { name: 'run_status', args: { workspace: 'w1', waitSeconds: 5 } },
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(answers[0]?.text).toContain('still going on');
  });
});
