// @vitest-environment jsdom
import type { IWorkspace } from '@/modules/Workspace/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRunNoticeViewModel } from '@/modules/Run/components/RunNotice/hooks/useRunNoticeViewModel';
import { recordedRun, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

function noticing(workspace: IWorkspace, runId = 'r-01') {
  useWorkspaceStore.setState({
    workspaces: [workspace],
    tab: 'chat',
    selectedRunId: null,
  });
  useAppStore.setState({
    runNotice: { key: 'k-1', workspaceId: 'w1', runId },
    replay: null,
    screen: 'welcome',
  });

  return renderHook(() => useRunNoticeViewModel()).result;
}

afterEach(() => {
  useAppStore.setState({ runNotice: null, replay: null });
});

describe('useRunNoticeViewModel', () => {
  it('says which run ended, in which workspace, how it went and the bugs it caught', () => {
    const result = noticing(
      recordedRun(['passed', 'passed', 'passed', 'passed', 'failed']),
    );

    expect(result.current).toMatchObject({
      isShown: true,
      kicker: 'Run r-01 finished',
      title: 'Checkout regression',
      bugs: '1 bug',
      mood: 'bug',
    });
    expect(result.current.tally.map(({ key, count }) => [key, count])).toEqual([
      ['passed', 4],
      ['failed', 1],
    ]);
  });

  it('cheers a run where everything passed, and counts no bugs', () => {
    const result = noticing(
      walkRun({ verdicts: ['passed', 'passed'], isFinished: true }),
    );

    expect(result.current).toMatchObject({ mood: 'passed', bugs: '' });
  });

  it('offers to watch the run once its video is in, and not before', () => {
    expect(noticing(recordedRun()).current.canWatch).toBe(true);
    expect(
      noticing(walkRun({ verdicts: ['passed'], isFinished: true })).current.canWatch,
    ).toBe(false);
  });

  it('shows nothing for a run that is gone', () => {
    expect(noticing(recordedRun(), 'r-09').current.isShown).toBe(false);
  });

  describe('onOpen', () => {
    it('takes the QA to the run, and goes', () => {
      const result = noticing(recordedRun());

      act(() => {
        result.current.onOpen();
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        tab: 'runs',
        selectedRunId: 'r-01',
      });
      expect(useAppStore.getState()).toMatchObject({
        screen: 'workspace',
        runNotice: null,
      });
    });
  });

  describe('onWatch', () => {
    it("plays the run's video from its start, and goes", () => {
      const result = noticing(recordedRun());

      act(() => {
        result.current.onWatch();
      });

      expect(useAppStore.getState().replay).toEqual({
        workspaceId: 'w1',
        runId: 'r-01',
        focus: { kind: 'run' },
      });
      expect(useAppStore.getState().runNotice).toBeNull();
    });
  });

  describe('onCountdownEnd', () => {
    it('goes on its own once the line under it has drained', () => {
      const result = noticing(recordedRun());

      act(() => {
        result.current.onCountdownEnd();
      });

      expect(useAppStore.getState().runNotice).toBeNull();
    });
  });
});
