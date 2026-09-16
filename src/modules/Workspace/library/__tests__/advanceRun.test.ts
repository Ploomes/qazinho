import type { IWorkspace } from '@/modules/Workspace/types';
import { RUN_ENGINE } from '@/modules/Run/constants';
import { advanceRun, startRun } from '@/modules/Workspace/library';
import { describe, expect, it } from 'vitest';
import { makeWorkspace } from './fixtures';

function tick(workspace: IWorkspace, times: number): IWorkspace {
  return Array.from({ length: times }).reduce<IWorkspace>(
    (current) => advanceRun(current),
    workspace,
  );
}

const RUNNING = startRun({ workspace: makeWorkspace(), startedAt: '09:41' });
const STEPS_IN_PLAN = 6;

describe('advanceRun', () => {
  it('does nothing while no run is in flight', () => {
    const idle = makeWorkspace();

    expect(advanceRun(idle)).toBe(idle);
  });

  it('counts the seconds but resolves nothing until the third tick', () => {
    const workspace = tick(RUNNING, RUN_ENGINE.ticksPerStep - 1);

    expect(workspace.live?.stepIndex).toBe(0);
    expect(workspace.live?.elapsedSec).toBeCloseTo(1);
  });

  it('resolves one step every third tick', () => {
    const workspace = tick(RUNNING, RUN_ENGINE.ticksPerStep * 2);

    expect(workspace.live?.stepIndex).toBe(2);
    expect(workspace.live?.verdicts).toEqual(['passed', 'passed']);
  });

  it('files the run in the history when the last step resolves', () => {
    const workspace = tick(RUNNING, RUN_ENGINE.ticksPerStep * STEPS_IN_PLAN);

    expect(workspace.live?.isRunning).toBe(false);
    expect(workspace.live?.isDone).toBe(true);
    expect(workspace.runs).toHaveLength(1);
    expect(workspace.runs[0]?.id).toBe('r-01');
  });

  it('lands the workspace as failed, because the mock run always breaks one step', () => {
    const workspace = tick(RUNNING, RUN_ENGINE.ticksPerStep * STEPS_IN_PLAN);

    expect(workspace.status).toBe('failed');
    expect(workspace.runs[0]?.counts).toEqual({
      passed: 4,
      failed: 1,
      blocked: 0,
      skipped: 1,
    });
  });

  it('does NOT keep ticking once the run is done', () => {
    const done = tick(RUNNING, RUN_ENGINE.ticksPerStep * STEPS_IN_PLAN);

    expect(advanceRun(done)).toBe(done);
  });
});
