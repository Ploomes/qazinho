import { describe, expect, it } from 'vitest';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from './fixtures';

describe('startRun', () => {
  it('opens a live run at the first step and turns the workspace running', () => {
    const workspace = startRun({ workspace: makeWorkspace(), startedAt: '09:41' });

    expect(workspace.status).toBe('running');
    expect(workspace.live).toMatchObject({
      stepIndex: 0,
      isRunning: true,
      isDone: false,
    });
    expect(workspace.live?.verdicts).toEqual([]);
  });

  it('does NOT start a workspace whose plan has no cases', () => {
    const empty = makeWorkspace([]);

    const workspace = startRun({ workspace: empty, startedAt: '09:41' });

    expect(workspace.live).toBeNull();
    expect(workspace.status).toBe('idle');
  });

  it('numbers the run after the ones already in the history', () => {
    const workspace = startRun({ workspace: makeWorkspace(), startedAt: '09:41' });

    expect(workspace.live?.id).toBe('r-01');
  });
});
