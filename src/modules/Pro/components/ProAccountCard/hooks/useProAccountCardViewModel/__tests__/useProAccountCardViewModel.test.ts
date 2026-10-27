// @vitest-environment jsdom
import type { IProOrgProject, ProDownload, ProStatus } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useProAccountCardViewModel } from '@/modules/Pro/components/ProAccountCard/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana Souza' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [
    { slug: 'loja', name: 'Loja Online', role: 'editor', billingStatus: 'active' },
    { slug: 'leitura', name: 'Conecta', role: 'reader', billingStatus: 'active' },
    { slug: 'outra', name: 'Outra', role: 'admin', billingStatus: 'trialing' },
  ],
  orgSlug: 'loja',
  isReachable: true,
};
const OFFER: IProOrgProject = {
  orgSlug: 'loja',
  projectId: 'p-2',
  key: 'APP',
  name: 'App da loja',
  plans: [{ workspaceId: 'w-2', name: 'Login', cases: 3 }],
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
  plans: [
    {
      workspaceId: 'w-2',
      name: 'Login',
      targetId: 't-web',
      targetKind: 'web',
      issue: null,
      design: null,
      cases: [],
    },
  ],
  variables: [{ name: 'LOGIN_PASSWORD', description: 'senha' }],
};

let chosen: string[] = [];
let opened: string[] = [];
let signedIn = 0;

function bridgeWith(props: { download?: ProDownload } = {}) {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    chooseProOrg: (orgSlug) => {
      chosen.push(orgSlug);

      return Promise.resolve({ ...SIGNED_IN, orgSlug });
    },
    downloadOrgProject: () => Promise.resolve(props.download ?? DOWNLOADED),
    openProPage: (path) => {
      opened.push(path);

      return Promise.resolve(true);
    },
    signInPro: () => {
      signedIn += 1;

      return Promise.resolve({
        steps: ['code', 'browser', 'account'],
        phase: 'connected',
        account: 'ana@loja.dev',
      });
    },
    proStatus: () => Promise.resolve(SIGNED_IN),
  };
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  chosen = [];
  opened = [];
  signedIn = 0;
  useProStore.setState({ status: SIGNED_IN, shares: [], orgProjects: [OFFER] });
  useAppStore.setState({ projects: [], selectedWorkspaceId: null, screen: 'welcome' });
  useWorkspaceStore.setState({ workspaces: [] });
  useVariablesStore.setState({ request: null, byProject: {} });
  useSettingsStore.setState({ isSidebarShut: false });
  bridgeWith();
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProAccountCardViewModel', () => {
  describe('what it shows', () => {
    it('shows nothing until it knows where this computer stands', () => {
      useProStore.setState({ status: null });

      expect(renderHook(() => useProAccountCardViewModel()).result.current.isShown).toBe(
        false,
      );
    });

    it('offers a way into the account while signed out, naming no plan', () => {
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      expect(renderHook(() => useProAccountCardViewModel()).result.current).toMatchObject(
        {
          isShown: true,
          isSignedIn: false,
          title: 'Sign in to your account',
          hasSubtitle: false,
          popup: undefined,
        },
      );
    });

    it('names the person and the org this computer sends to', () => {
      expect(renderHook(() => useProAccountCardViewModel()).result.current).toMatchObject(
        {
          isSignedIn: true,
          title: 'Ana Souza',
          subtitle: 'Loja Online · editor',
          initials: 'AS',
          email: 'ana@loja.dev',
          machine: 'This computer · MacBook-Ana',
          hasAttention: false,
          popup: 'dialog',
        },
      );
    });

    it('lists the orgs, with the one it sends to on and one it only reads in off', () => {
      const { orgs } = renderHook(() => useProAccountCardViewModel()).result.current;

      expect(
        orgs.map(({ slug, note, isOn, isDisabled }) => ({
          slug,
          note,
          isOn,
          isDisabled,
        })),
      ).toEqual([
        { slug: 'loja', note: 'editor · active', isOn: true, isDisabled: false },
        { slug: 'leitura', note: 'reader · active', isOn: false, isDisabled: true },
        { slug: 'outra', note: 'admin · in trial', isOn: false, isDisabled: false },
      ]);
    });

    it('says what the QA should know, on the card itself', () => {
      useProStore.setState({
        shares: [
          {
            projectId: 'p1',
            orgSlug: 'loja',
            state: 'blocked',
            syncedAt: null,
            conflicts: [],
          },
        ],
      });

      expect(renderHook(() => useProAccountCardViewModel()).result.current).toMatchObject(
        {
          hasAttention: true,
          attention:
            'The org is blocked until its payment is in order; nothing goes until then.',
        },
      );
    });

    it('offers the org’s projects this computer does not have yet', () => {
      const { offers } = renderHook(() => useProAccountCardViewModel()).result.current;

      expect(offers).toMatchObject([
        {
          key: 'p-2',
          name: 'App da loja',
          meta: '1 plan',
          label: 'Download',
          failure: null,
        },
      ]);

      useAppStore.setState({
        projects: [{ id: 'p-2', name: 'App da loja', targets: [], repositories: [] }],
      });

      expect(
        renderHook(() => useProAccountCardViewModel()).result.current.offers,
      ).toEqual([]);
    });
  });

  describe('onToggle', () => {
    it('starts signing in from a computer signed out', async () => {
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      const { result } = renderHook(() => useProAccountCardViewModel());

      act(() => {
        result.current.onToggle();
      });

      await waitFor(() => {
        expect(useProStore.getState().status).toEqual(SIGNED_IN);
      });
      expect(signedIn).toBe(1);
    });

    it('opens the account once signed in, and shuts it again', () => {
      const { result } = renderHook(() => useProAccountCardViewModel());

      act(() => {
        result.current.onToggle();
      });

      expect(result.current).toMatchObject({ isOpen: true, isExpanded: true });

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('opens the sidebar first when it is folded to a rail', () => {
      useSettingsStore.setState({ isSidebarShut: true });

      const { result } = renderHook(() => useProAccountCardViewModel());

      act(() => {
        result.current.onToggle();
      });

      expect(useSettingsStore.getState().isSidebarShut).toBe(false);
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('choosing the org', () => {
    it('sends to another org the person writes in, and never to one they only read', async () => {
      const { result } = renderHook(() => useProAccountCardViewModel());

      act(() => {
        result.current.orgs[1]?.onClick();
        result.current.orgs[0]?.onClick();
        result.current.orgs[2]?.onClick();
      });

      await waitFor(() => {
        expect(useProStore.getState().status).toMatchObject({ orgSlug: 'outra' });
      });
      expect(chosen).toEqual(['outra']);
    });
  });

  describe('onDownload', () => {
    it('brings the project and its plans here, asks for its variables and opens it', async () => {
      const { result } = renderHook(() => useProAccountCardViewModel());

      act(() => {
        result.current.offers[0]?.onDownload();
      });

      await waitFor(() => {
        expect(useAppStore.getState().projects.map(({ id }) => id)).toEqual(['p-2']);
      });
      expect(
        useWorkspaceStore
          .getState()
          .workspaces.map(({ id, projectId }) => ({ id, projectId })),
      ).toEqual([{ id: 'w-2', projectId: 'p-2' }]);
      expect(useVariablesStore.getState().request).toMatchObject({
        projectId: 'p-2',
        drafts: [{ name: 'LOGIN_PASSWORD', description: 'senha' }],
        by: 'org',
      });
      expect(useAppStore.getState().selectedWorkspaceId).toBe('w-2');
    });

    it('says why a project did not come, beside it', async () => {
      bridgeWith({ download: { isDownloaded: false, failure: 'gone' } });

      const { result } = renderHook(() => useProAccountCardViewModel());

      act(() => {
        result.current.offers[0]?.onDownload();
      });

      await waitFor(() => {
        expect(result.current.offers[0]?.failure).toBe('It is no longer in the org.');
      });
      expect(useAppStore.getState().projects).toEqual([]);
    });
  });

  describe('onOpenSite', () => {
    it('opens the org in QAzinho Pro', () => {
      const { result } = renderHook(() => useProAccountCardViewModel());

      act(() => {
        result.current.onOpenSite();
      });

      expect(opened).toEqual(['/loja']);
    });

    it('opens where an account in no org opens one', () => {
      useProStore.setState({ status: { ...SIGNED_IN, orgs: [], orgSlug: null } });
      const { result } = renderHook(() => useProAccountCardViewModel());

      expect(result.current.canOpenSite).toBe(true);
      act(() => {
        result.current.onOpenSite();
      });

      expect(opened).toEqual(['/app/new']);
    });

    it('opens nothing for an account that only reads in its orgs', () => {
      useProStore.setState({ status: { ...SIGNED_IN, orgSlug: null } });
      const { result } = renderHook(() => useProAccountCardViewModel());

      expect(result.current.canOpenSite).toBe(false);
    });
  });
});
