import { describe, expect, it } from 'vitest';
import { startRun, workspaceMeta } from '@/modules/Workspace/library';
import { makeWorkspace, WALKED_BY } from './fixtures';

describe('workspaceMeta', () => {
  it('reads new while the workspace has no plan', () => {
    expect(workspaceMeta(makeWorkspace([]))).toEqual({
      key: 'SIDEBAR.META_NEW',
      count: 0,
    });
  });

  it('counts the steps of the plan once one is drafted', () => {
    expect(workspaceMeta(makeWorkspace())).toEqual({
      key: 'SIDEBAR.META_STEPS',
      count: 6,
    });
  });

  it('shows the progress of the run above everything else', () => {
    const running = startRun({
      workspace: makeWorkspace(),
      startedAt: '09:41',
      runId: 'r-01',
      by: WALKED_BY,
    });

    expect(workspaceMeta(running)).toEqual({ key: 'SIDEBAR.META_PROGRESS', count: 6 });
  });

  it('counts bugs before the plan, and says bug in the singular', () => {
    const one = { ...makeWorkspace(), bugs: [{ id: 'BUG-01' }] } as never;

    expect(workspaceMeta(one)).toEqual({ key: 'SIDEBAR.META_BUG_ONE', count: 1 });
  });
});
