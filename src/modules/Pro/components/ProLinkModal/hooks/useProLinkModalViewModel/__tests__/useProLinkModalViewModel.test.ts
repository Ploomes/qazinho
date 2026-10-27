// @vitest-environment jsdom
import type { IProLink, ProDownload, ProStatus } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useProLinkModalViewModel } from '@/modules/Pro/components/ProLinkModal/hooks';
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

const LINK: IProLink = { orgSlug: 'loja', projectId: 'p-2', workspaceId: 'w-2' };

const bridgeWith = (download: ProDownload = DOWNLOADED) => {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    downloadOrgProject: () => Promise.resolve(download),
    listOrgProjects: () =>
      Promise.resolve({
        isListed: true,
        projects: [
          {
            orgSlug: 'loja',
            projectId: 'p-2',
            key: 'APP',
            name: 'App da loja',
            plans: [{ workspaceId: 'w-2', name: 'Login', cases: 3 }],
          },
        ],
      }),
  };
};

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  bridgeWith();
  useProStore.setState({ status: SIGNED_IN, link: LINK });
  useAppStore.setState({ projects: [], selectedWorkspaceId: null });
  useWorkspaceStore.setState({ workspaces: [], panelTab: 'device' });
  useVariablesStore.setState({ request: null, byProject: {} });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProLinkModalViewModel', () => {
  it('names the project and plan the org holds, and offers to bring them here', async () => {
    const { result } = renderHook(() => useProLinkModalViewModel());

    await waitFor(() => {
      expect(result.current.names).toBe('App da loja · Login');
    });
    expect(result.current).toMatchObject({
      hasNames: true,
      confirmLabel: 'Download and open',
      subtitle: expect.stringMatching(/Download its project from Loja Online/),
    });
  });

  it('downloads the project and opens the plan the link named, on its plan', async () => {
    const { result } = renderHook(() => useProLinkModalViewModel());

    act(() => {
      result.current.onConfirm();
    });

    await waitFor(() => {
      expect(useProStore.getState().link).toBeNull();
    });
    expect(useAppStore.getState().selectedWorkspaceId).toBe('w-2');
    expect(useWorkspaceStore.getState().panelTab).toBe('plan');
  });

  it('says why the project did not come, and stays open', async () => {
    bridgeWith({ isDownloaded: false, failure: 'gone' });
    const { result } = renderHook(() => useProLinkModalViewModel());

    act(() => {
      result.current.onConfirm();
    });

    await waitFor(() => {
      expect(result.current.failure).toBe('It is no longer in the org.');
    });
    expect(useProStore.getState().link).toEqual(LINK);
    expect(result.current.canConfirm).toBe(true);
  });

  it('asks to sign in when this computer is out, and downloads nothing', () => {
    useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });
    const { result } = renderHook(() => useProLinkModalViewModel());

    expect(result.current).toMatchObject({
      subtitle: expect.stringMatching(/^This plan belongs to the org loja. Sign in/),
      confirmLabel: 'OK',
    });

    act(() => {
      result.current.onConfirm();
    });

    expect(useProStore.getState().link).toBeNull();
    expect(useAppStore.getState().projects).toEqual([]);
  });

  it('says so when the account is not in the org, or the plan is still to come here', () => {
    useProStore.setState({ link: { ...LINK, orgSlug: 'outra' } });
    const outside = renderHook(() => useProLinkModalViewModel());

    expect(outside.result.current.subtitle).toBe(
      'This plan belongs to the org outra, and your account is not in it.',
    );

    useProStore.setState({ link: LINK });
    useAppStore.setState({
      projects: [{ ...useAppStore.getState().projects[0], id: 'p-2' } as never],
    });
    const notHere = renderHook(() => useProLinkModalViewModel());

    expect(notHere.result.current).toMatchObject({
      subtitle: expect.stringMatching(/^Its project is on this computer/),
      confirmLabel: 'OK',
    });
  });
});
