import { mapWorkspace } from '@/store/WorkspaceStore/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { describe, expect, it } from 'vitest';

const FIRST = makeWorkspace();
const SECOND = { ...makeWorkspace(), id: 'w2', name: 'Bug bash' };

describe('mapWorkspace', () => {
  it('changes only the workspace it was pointed at', () => {
    const workspaces = mapWorkspace({
      workspaces: [FIRST, SECOND],
      workspaceId: 'w2',
      change: (workspace) => ({ ...workspace, status: 'running' }),
    });

    expect(workspaces[0]?.status).toBe('idle');
    expect(workspaces[1]?.status).toBe('running');
  });

  it('leaves every workspace alone when the id matches none', () => {
    const workspaces = mapWorkspace({
      workspaces: [FIRST, SECOND],
      workspaceId: 'gone',
      change: (workspace) => ({ ...workspace, status: 'running' }),
    });

    expect(workspaces).toEqual([FIRST, SECOND]);
  });
});
