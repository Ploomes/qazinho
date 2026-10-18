import { describe, expect, it } from 'vitest';
import { startRun } from '@/modules/Workspace';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { tickWorkspaces } from '@/store/WorkspaceStore/library';

const IDLE = makeWorkspace();
const RUNNING = startRun({
  workspace: { ...makeWorkspace(), id: 'w2' },
  startedAt: '09:41',
  runId: 'r-01',
});

describe('tickWorkspaces', () => {
  it('moves the clock of the run that is going, and leaves the rest as they were', () => {
    const ticked = tickWorkspaces({ workspaces: [IDLE, RUNNING], seconds: 1 });

    expect(ticked[0]).toBe(IDLE);
    expect(ticked[1]?.live?.elapsedSec).toBe(1);
  });

  /**
   * The clock ticks every second whether a run is going or not. A new list on every tick made
   * every screen that reads the workspaces render again, every second, with nothing running.
   */
  it('hands back the very same list while no run is going', () => {
    const workspaces = [IDLE, { ...makeWorkspace(), id: 'w3' }];

    expect(tickWorkspaces({ workspaces, seconds: 1 })).toBe(workspaces);
  });
});
