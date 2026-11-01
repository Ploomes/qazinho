// @vitest-environment jsdom
import type { IWorkspace } from '@/modules/Workspace/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRunNoticeViewModel } from '@/modules/Run/components/RunNotice/hooks/useRunNoticeViewModel';
import { endRun, landFinding, landStep, startRun } from '@/modules/Workspace/library';
import {
  recordedRun,
  walkRun,
  makeWorkspace,
  WALKED_BY,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

function noticing(workspace: IWorkspace, runId = 'r-01') {
  useWorkspaceStore.setState({
    workspaces: [workspace],
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
        panelTab: 'runs',
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
  it('says an exploration ended by its screens and its bugs, not by verdicts', () => {
    let workspace = startRun({
      workspace: makeWorkspace([]),
      startedAt: '10:00',
      runId: 'r-01',
      by: WALKED_BY,
      kind: 'explore',
    });

    for (const [index, name] of ['Shop', 'Cart'].entries())
      workspace = landStep({
        workspace,
        outcome: {
          workspaceId: 'w1',
          caseId: 'EX',
          stepNumber: index + 1,
          index,
          action: name,
          expected: '',
          verdict: 'passed',
          why: '',
          got: '',
          title: '',
          severity: 'low',
          tookMs: 1_000,
          at: 1_760_000_000_000 + index * 1_000,
          screenshot: null,
          shotFile: null,
        },
        at: '10:00',
      });

    workspace = landFinding({
      workspace,
      finding: {
        caseId: 'EX',
        stepNumber: 2,
        index: 1,
        action: 'Cart',
        title: 'Cart total ignores the shirt',
        severity: 'high',
        at: 1_760_000_002_000,
        expected: 'R$ 79,90',
        got: 'R$ 0,00',
        screenshot: null,
        shotFile: null,
      },
      at: '10:01',
    });

    const result = noticing(endRun({ workspace, at: '10:02', endedBy: 'finished' }));

    expect(result.current).toMatchObject({
      kicker: 'Exploration r-01 finished',
      bugs: '2 screens · 1 bug',
      mood: 'bug',
      tally: [],
    });
  });
});
