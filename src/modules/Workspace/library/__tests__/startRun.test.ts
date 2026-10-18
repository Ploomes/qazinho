import { describe, expect, it } from 'vitest';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace, WALKED_BY, walkRun } from './fixtures';

describe('startRun', () => {
  it('opens a live run with nothing decided and turns the workspace running', () => {
    const workspace = startRun({
      workspace: makeWorkspace(),
      startedAt: '09:41',
      runId: 'r-01',
      by: WALKED_BY,
    });

    expect(workspace.status).toBe('running');
    expect(workspace.live).toMatchObject({
      id: 'r-01',
      doingIndex: -1,
      isRunning: true,
      isDone: false,
    });
    expect(workspace.live?.outcomes).toEqual([]);
    expect(workspace.live?.shot).toBeNull();
    expect(workspace.live?.by).toEqual(WALKED_BY);
  });

  it('does NOT start a workspace whose plan has no cases', () => {
    const empty = makeWorkspace([]);

    const workspace = startRun({
      workspace: empty,
      startedAt: '09:41',
      runId: 'r-01',
      by: WALKED_BY,
    });

    expect(workspace.live).toBeNull();
    expect(workspace.status).toBe('idle');
  });

  it('the bugs from the run before stop being the new ones', () => {
    const caught = walkRun({ verdicts: ['failed'], isFinished: true });

    const again = startRun({
      workspace: caught,
      startedAt: '10:02',
      runId: 'r-02',
      by: WALKED_BY,
    });

    expect(caught.bugs[0]?.isNew).toBe(true);
    expect(again.bugs[0]?.isNew).toBe(false);
  });
});
