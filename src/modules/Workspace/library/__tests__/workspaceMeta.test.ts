import { describe, expect, it } from 'vitest';
import { startRun, workspaceMeta } from '@/modules/Workspace/library';
import { makeWorkspace } from './fixtures';

describe('workspaceMeta', () => {
  it('reads new while the workspace has no plan', () => {
    expect(workspaceMeta(makeWorkspace([]))).toBe('new');
  });

  it('counts the steps of the plan once one is drafted', () => {
    expect(workspaceMeta(makeWorkspace())).toBe('6 steps');
  });

  it('shows the progress of the run above everything else', () => {
    const running = startRun({ workspace: makeWorkspace(), startedAt: '09:41' });

    const workspace = { ...running, live: { ...running.live!, stepIndex: 2 } };

    expect(workspaceMeta(workspace)).toBe('2/6');
  });

  it('counts bugs before the plan, and says bug in the singular', () => {
    const one = { ...makeWorkspace(), bugs: [{ id: 'BUG-01' }] } as never;

    expect(workspaceMeta(one)).toBe('1 bug');
  });
});
