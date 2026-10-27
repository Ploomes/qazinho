// @vitest-environment jsdom
import type { ProDownload, ProStatus } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useOrgDownload } from '@/modules/Pro/hooks/useOrgDownload';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useVariablesStore, useWorkspaceStore } from '@/store';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana Souza' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [{ slug: 'loja', name: 'Loja Online', role: 'editor', billingStatus: 'active' }],
  isReachable: true,
};
const DOWNLOADED: ProDownload = {
  isDownloaded: true,
  orgSlug: 'loja',
  project: {
    projectId: 'p-2',
    name: 'App da loja',
    targets: [{ id: 't-web', kind: 'web', label: 'Web', value: 'https://app.loja.dev' }],
    repositories: [],
  },
  plans: ['w-1', 'w-2'].map((workspaceId) => ({
    workspaceId,
    name: workspaceId === 'w-2' ? 'Login' : 'Cadastro',
    targetId: 't-web',
    targetKind: 'web' as const,
    issue: null,
    design: null,
    cases: [],
  })),
  variables: [{ name: 'LOGIN_PASSWORD', description: 'senha' }],
};

const bridgeWith = (download: ProDownload) => {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    downloadOrgProject: () => Promise.resolve(download),
  };
};

beforeEach(() => {
  useProStore.setState({ status: SIGNED_IN });
  useAppStore.setState({ projects: [] });
  useWorkspaceStore.setState({ workspaces: [] });
  useVariablesStore.setState({ request: null, byProject: {} });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useOrgDownload', () => {
  it('brings the project and each plan here, asks for its variables, and names the workspaces', async () => {
    bridgeWith(DOWNLOADED);
    const { result } = renderHook(() => useOrgDownload());
    let end: Awaited<ReturnType<typeof result.current>> | null = null;

    await act(async () => {
      end = await result.current({ orgSlug: 'loja', projectId: 'p-2' });
    });

    expect(end).toEqual({ isDownloaded: true, workspaceIds: ['w-1', 'w-2'] });
    expect(useAppStore.getState().projects.map(({ id }) => id)).toEqual(['p-2']);
    expect(useWorkspaceStore.getState().workspaces.map(({ id }) => id)).toEqual([
      'w-1',
      'w-2',
    ]);
    expect(useVariablesStore.getState().request).toMatchObject({
      projectId: 'p-2',
      by: 'org',
    });
  });

  it('says why nothing came, and brings nothing', async () => {
    bridgeWith({ isDownloaded: false, failure: 'here' });
    const { result } = renderHook(() => useOrgDownload());
    let end: Awaited<ReturnType<typeof result.current>> | null = null;

    await act(async () => {
      end = await result.current({ orgSlug: 'loja', projectId: 'p-2' });
    });

    expect(end).toEqual({ isDownloaded: false, failure: 'here' });
    expect(useAppStore.getState().projects).toEqual([]);
  });
});
