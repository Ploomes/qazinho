// @vitest-environment jsdom
import type {
  IProOrgProject,
  ProDownload,
  ProOrgProjects,
  ProStatus,
} from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useProCloneModalViewModel } from '@/modules/Pro/components/ProCloneModal/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useVariablesStore, useWorkspaceStore } from '@/store';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [
    { slug: 'loja', name: 'Loja Online', role: 'editor', billingStatus: 'active' },
    { slug: 'outra', name: 'Outra', role: 'reader', billingStatus: 'active' },
  ],
  isReachable: true,
};
const APP: IProOrgProject = {
  orgSlug: 'loja',
  projectId: 'p-2',
  key: 'APP',
  name: 'App da loja',
  plans: [{ workspaceId: 'w-2', name: 'Login', cases: 3 }],
};
const SITE: IProOrgProject = {
  orgSlug: 'loja',
  projectId: 'p-3',
  key: 'SITE',
  name: 'Site institucional',
  plans: [],
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
  variables: [],
};

let asked: string[] = [];
let closed = 0;

function bridgeWith(props: {
  lists?: Record<string, ProOrgProjects>;
  download?: ProDownload;
}) {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listOrgProjects: (orgSlug) => {
      asked.push(orgSlug);

      return Promise.resolve(
        props.lists?.[orgSlug] ?? { isListed: true, projects: [APP, SITE] },
      );
    },
    downloadOrgProject: () => Promise.resolve(props.download ?? DOWNLOADED),
  };
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  asked = [];
  closed = 0;
  useProStore.setState({ status: SIGNED_IN, shares: [] });
  useAppStore.setState({ projects: [], selectedWorkspaceId: null, screen: 'welcome' });
  useWorkspaceStore.setState({ workspaces: [] });
  useVariablesStore.setState({ request: null, byProject: {} });
  bridgeWith({});
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

async function mounted() {
  const hook = renderHook(() =>
    useProCloneModalViewModel({
      onClose: () => {
        closed += 1;
      },
    }),
  );

  await waitFor(() => {
    expect(hook.result.current.note).toBeNull();
  });

  return hook;
}

describe('useProCloneModalViewModel', () => {
  describe('what it shows', () => {
    it('reads the first org’s projects, saying so while it waits', async () => {
      const { result } = renderHook(() =>
        useProCloneModalViewModel({ onClose: () => {} }),
      );

      expect(result.current.note).toBe('Reading the projects of Loja Online…');

      await waitFor(() => {
        expect(result.current.projects.map(({ name }) => name)).toEqual([
          'App da loja',
          'Site institucional',
        ]);
      });
      expect(result.current.projects[0]).toMatchObject({
        code: 'APP',
        meta: '1 plan',
        label: 'Clone',
        isHere: false,
        failure: null,
      });
      expect(asked).toEqual(['loja']);
    });

    it('offers to choose an org only to a person in several', async () => {
      const { result } = await mounted();

      expect(result.current.hasOrgChoice).toBe(true);

      useProStore.setState({ status: { ...SIGNED_IN, orgs: [SIGNED_IN.orgs[0]!] } });
      const single = await mounted();

      expect(single.result.current.hasOrgChoice).toBe(false);
    });

    it('says a project is on this computer already, offering no clone', async () => {
      useAppStore.setState({
        projects: [{ id: 'p-2', name: 'App da loja', targets: [], repositories: [] }],
      });
      const { result } = await mounted();

      expect(result.current.projects[0]).toMatchObject({
        isHere: true,
        hereLabel: 'On this computer',
      });
    });

    it('says an org has no project, and one that did not answer', async () => {
      bridgeWith({
        lists: {
          loja: { isListed: true, projects: [] },
          outra: { isListed: false, failure: 'unreachable' },
        },
      });
      const { result } = renderHook(() =>
        useProCloneModalViewModel({ onClose: () => {} }),
      );

      await waitFor(() => {
        expect(result.current.note).toBe('Loja Online has no project yet.');
      });

      act(() => {
        result.current.orgs[1]?.onClick();
      });

      await waitFor(() => {
        expect(result.current.note).toBe('Outra did not answer. Try again.');
      });
    });
  });

  describe('onQuery', () => {
    it('keeps the projects whose name or key holds what was typed, whatever its case', async () => {
      const { result } = await mounted();

      act(() => {
        result.current.onQuery('site');
      });

      expect(result.current.projects.map(({ id }) => id)).toEqual(['p-3']);

      act(() => {
        result.current.onQuery(' app ');
      });

      expect(result.current.projects.map(({ id }) => id)).toEqual(['p-2']);
    });

    it('says when nothing of the org matches', async () => {
      const { result } = await mounted();

      act(() => {
        result.current.onQuery('checkout');
      });

      expect(result.current).toMatchObject({
        projects: [],
        note: 'No project of Loja Online matches.',
      });
    });
  });

  describe('orgs.onClick', () => {
    it('reads another org’s projects once it is chosen', async () => {
      bridgeWith({
        lists: {
          outra: {
            isListed: true,
            projects: [{ ...SITE, orgSlug: 'outra', projectId: 'p-9' }],
          },
        },
      });
      const { result } = await mounted();

      act(() => {
        result.current.orgs[1]?.onClick();
      });

      await waitFor(() => {
        expect(result.current.projects.map(({ id }) => id)).toEqual(['p-9']);
      });
      expect(result.current.orgs.map(({ isOn }) => isOn)).toEqual([false, true]);
      expect(asked).toEqual(['loja', 'outra']);
    });

    it('does NOT read again the org already chosen', async () => {
      const { result } = await mounted();

      act(() => {
        result.current.orgs[0]?.onClick();
      });

      expect(asked).toEqual(['loja']);
    });
  });

  describe('projects.onClone', () => {
    it('brings the project here, opens its first plan and closes', async () => {
      const { result } = await mounted();

      act(() => {
        result.current.projects[0]?.onClone();
      });

      await waitFor(() => {
        expect(closed).toBe(1);
      });
      expect(useAppStore.getState().projects.map(({ id }) => id)).toEqual(['p-2']);
      expect(useAppStore.getState().selectedWorkspaceId).toBe('w-2');
    });

    it('says why a project did not come, beside it, and stays open', async () => {
      bridgeWith({ download: { isDownloaded: false, failure: 'gone' } });
      const { result } = await mounted();

      act(() => {
        result.current.projects[0]?.onClone();
      });

      await waitFor(() => {
        expect(result.current.projects[0]?.failure).toBe('It is no longer in the org.');
      });
      expect(closed).toBe(0);
      expect(useAppStore.getState().projects).toEqual([]);
    });
  });

  describe('a call that fails', () => {
    it('says the project did not come, and offers cloning it again', async () => {
      bridgeWith({});
      window.qazinho = {
        ...window.qazinho,
        downloadOrgProject: () => Promise.reject(new Error('main went away')),
      };
      const { result } = await mounted();

      act(() => {
        result.current.projects[0]?.onClone();
      });

      await waitFor(() => {
        expect(result.current.projects[0]?.failure).toBe(
          'The org did not hand it over. Try again later.',
        );
      });
      expect(result.current.projects[0]?.isWorking).toBe(false);
    });
  });

  describe('onConfirm', () => {
    it('closes the window', async () => {
      const { result } = await mounted();

      act(() => {
        result.current.onConfirm();
      });

      expect(closed).toBe(1);
    });
  });
});
