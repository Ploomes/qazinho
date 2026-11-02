// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { toSaved } from '@/modules/Workspace';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useArchive } from '@/shared/hooks/useArchive';
import { useAppStore, useWorkspaceStore } from '@/store';

const mainWith = (workspaceId: string) => {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    readState: () =>
      Promise.resolve({
        projects: '[]',
        workspaces: [
          toSaved({ workspace: { ...makeWorkspace(), id: workspaceId }, at: '10:00' }),
        ],
      }),
  };
};

const loaded = async () => {
  renderHook(() => useArchive());
  await waitFor(() => {
    expect(useWorkspaceStore.getState().isLoaded).toBe(true);
  });
};

beforeEach(() => {
  useWorkspaceStore.setState({ workspaces: [], isLoaded: false });
  useAppStore.setState({ screen: 'welcome', selectedWorkspaceId: null });
});

afterEach(cleanup);

describe('useArchive', () => {
  /** Um QA volta ao app todo dia: cair na tela de escolher custava dois cliques. */
  it('opens the workspace the QA left open', async () => {
    mainWith('w1');
    useAppStore.setState({ selectedWorkspaceId: 'w1' });

    await loaded();

    expect(useAppStore.getState().screen).toBe('workspace');
    expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
  });

  it('goes home when that workspace is gone', async () => {
    mainWith('w2');
    useAppStore.setState({ selectedWorkspaceId: 'w1' });

    await loaded();

    expect(useAppStore.getState().screen).toBe('welcome');
    expect(useAppStore.getState().selectedWorkspaceId).toBeNull();
  });

  it('stays home when nothing was open', async () => {
    mainWith('w1');

    await loaded();

    expect(useAppStore.getState().screen).toBe('welcome');
  });
});
