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
  /**
   * O app abria no último workspace. Agora abre no Início, que diz o que pede o QA e traz
   * o último plano a um clique, em Abertos por último.
   */
  it('opens on the home screen, even when a plan was open when the app closed', async () => {
    mainWith('w1');
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
