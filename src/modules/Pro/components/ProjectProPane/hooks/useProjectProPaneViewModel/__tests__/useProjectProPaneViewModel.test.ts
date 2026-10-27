// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import type { IProShare, IProSyncBatch, ProStatus } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectProPaneViewModel } from '@/modules/Pro/components/ProjectProPane/hooks';
import {
  makeWorkspace,
  recordedRun,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

const PROJECT: IProject = {
  id: 'p1',
  name: 'Loja',
  targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://loja.dev' }],
  repositories: [],
};
const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [
    { slug: 'late', name: 'Atrasada', role: 'owner', billingStatus: 'blocked' },
    { slug: 'loja', name: 'Loja Online', role: 'editor', billingStatus: 'active' },
    { slug: 'reads', name: 'Só leitura', role: 'reader', billingStatus: 'active' },
  ],
  isReachable: true,
};
const LINKED: IProShare = {
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: '2026-10-24T12:00:00.000Z',
  pending: [],
  conflicts: [],
};
const MOVED = {
  workspaceId: 'w1',
  base: [],
  version: 4,
  cases: [],
  editedBy: 'Bruno',
  editedAt: '2026-10-24T11:30:00.000Z',
};

const pane = () => renderHook(() => useProjectProPaneViewModel({ projectId: 'p1' }));

beforeEach(() => {
  window.qazinho = fakeQazinhoApi('darwin');
  useAppStore.setState({
    projects: [PROJECT],
    modal: 'project',
    editingProjectId: 'p1',
    projectSection: 'pro',
  });
  useWorkspaceStore.setState({ workspaces: [recordedRun(['passed', 'failed'])] });
  useProStore.setState({ status: SIGNED_IN, shares: [] });
  useVariablesStore.setState({ byProject: {}, request: null, settled: null });
  useSettingsStore.setState({ language: 'en' });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProjectProPaneViewModel', () => {
  describe('before a project is linked', () => {
    it('asks to sign in first while signed out', () => {
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      expect(pane().result.current).toMatchObject({
        isSignedOut: true,
        isLocal: false,
        isLinked: false,
      });
    });

    it('says there is nowhere to publish to an account that writes in no org', () => {
      useProStore.setState({
        status: {
          ...SIGNED_IN,
          orgs: SIGNED_IN.orgs.filter(({ role }) => role === 'reader'),
        },
      });

      expect(pane().result.current).toMatchObject({ isNoOrg: true, isLocal: false });
    });

    it('offers the orgs the person writes in, on the first paid up', () => {
      const { local } = pane().result.current;

      expect(local.orgs.map(({ slug, isOn }) => [slug, isOn])).toEqual([
        ['late', false],
        ['loja', true],
      ]);
      expect(local.publishLabel).toBe('Publish to Loja Online');
    });

    it('says what publishing sends and what its media weigh', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        briefPro: () =>
          Promise.resolve({ plans: 1, runs: 3, bugs: 0, mediaBytes: 1_440_000_000 }),
      };

      const { result } = pane();

      await waitFor(() => {
        expect(result.current.local.hasFacts).toBe(true);
      });
      expect(result.current.local.facts).toEqual(['1 plan', '3 runs', '0 bugs']);
      expect(result.current.local.mediaNote).toContain('1.4 GB');
    });

    it('publishes to the org chosen, leaving the history’s media here unless told', async () => {
      const published: {
        batch: IProSyncBatch;
        orgSlug: string;
        hasHistoryMedia: boolean;
      }[] = [];

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        publishPro: (props) => {
          published.push(props);

          return Promise.resolve({ ...LINKED, orgSlug: props.orgSlug });
        },
      };

      const { result } = pane();

      expect(result.current.local.isMediaOn).toBe(false);

      act(() => {
        result.current.local.orgs[0]?.onClick();
      });
      act(() => {
        result.current.onPublish();
      });

      await waitFor(() => {
        expect(useProStore.getState().shares).toMatchObject([{ orgSlug: 'late' }]);
      });
      expect(published).toMatchObject([
        {
          orgSlug: 'late',
          hasHistoryMedia: false,
          batch: { project: { projectId: 'p1' } },
        },
      ]);
    });

    it('sends the history’s media too once the QA turns it on', async () => {
      const published: boolean[] = [];

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        publishPro: (props) => {
          published.push(props.hasHistoryMedia);

          return Promise.resolve({ ...LINKED, orgSlug: props.orgSlug });
        },
      };

      const { result } = pane();

      act(() => {
        result.current.onMediaChange(true);
      });
      act(() => {
        result.current.onPublish();
      });

      await waitFor(() => {
        expect(published).toEqual([true]);
      });
    });
  });

  describe('a call that fails', () => {
    it('frees publishing again instead of saying it is publishing for good', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        publishPro: () => Promise.reject(new Error('main went away')),
      };
      const { result } = pane();

      await act(async () => {
        result.current.onPublish();
        await new Promise((done) => setTimeout(done, 0));
      });

      expect(result.current.local.canPublish).toBe(true);
      expect(result.current.local.publishLabel).toBe('Publish to Loja Online');
    });
  });

  describe('once linked', () => {
    beforeEach(() => {
      useProStore.setState({ shares: [LINKED] });
    });

    it('names the org and when it last took what changed', () => {
      expect(pane().result.current).toMatchObject({
        isLinked: true,
        isLocal: false,
        hasUnlink: true,
        linked: { title: 'Linked to Loja Online' },
      });
      expect(pane().result.current.linked.stateLine).toMatch(/^Last sent Oct 24, 2026/);
    });

    it('says why nothing goes when the org refuses', () => {
      useProStore.setState({ shares: [{ ...LINKED, state: 'blocked' }] });

      expect(pane().result.current.linked.stateLine).toBe(
        'Loja Online is blocked until its payment is in order; nothing goes until then.',
      );
    });

    it('sends the plans edited here when asked, and does NOT offer it with none', async () => {
      const sendProPlans = vi.fn(({ project }: IProSyncBatch) =>
        Promise.resolve({ ...LINKED, projectId: project.projectId }),
      );

      window.qazinho = { ...fakeQazinhoApi('darwin'), sendProPlans };

      expect(pane().result.current.linked).toMatchObject({
        canSend: false,
        pendingText: 'No plan edited here waits to be sent.',
      });

      useProStore.setState({ shares: [{ ...LINKED, pending: ['w1'] }] });

      const { result } = pane();

      expect(result.current.linked.pendingText).toBe(
        '1 plan edited here waits to be sent: Checkout regression.',
      );

      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(sendProPlans).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(useProStore.getState().shares).toMatchObject([{ pending: [] }]);
      });
    });

    it('tells of the plans the org moved, and takes them in when asked', async () => {
      useProStore.setState({
        shares: [{ ...LINKED, state: 'conflict', conflicts: [MOVED] }],
      });

      const { result } = pane();

      expect(result.current.linked).toMatchObject({
        hasUpdates: true,
        updatesText: '1 plan changed in the org: Checkout regression.',
      });

      act(() => {
        result.current.onUpdate();
      });

      await waitFor(() => {
        expect(result.current.linked.updateLabel).toBe('Update from the org');
      });
    });

    it('says which moved plans are running, and offers no update while every one is', () => {
      useWorkspaceStore.setState({
        workspaces: [
          walkRun({ workspace: recordedRun(['passed']), verdicts: ['passed'] }),
        ],
      });
      useProStore.setState({
        shares: [{ ...LINKED, state: 'conflict', conflicts: [MOVED] }],
      });

      const { linked } = pane().result.current;

      expect(linked.hasUpdatesRunning).toBe(true);
      expect(linked.updatesRunningText).toBe(
        'Checkout regression is running: update it once its run ends.',
      );
      expect(linked.canUpdate).toBe(false);
    });

    it('unlinks the project, which stays here', async () => {
      const { result } = pane();

      act(() => {
        result.current.onUnlink();
      });

      await waitFor(() => {
        expect(useProStore.getState().shares).toEqual([]);
      });
      expect(useAppStore.getState().projects).toHaveLength(1);
    });

    it('copies the project as a new one with its plans and variables, and opens it', async () => {
      const copyVariables = vi.fn(() =>
        Promise.resolve({
          isSaved: true as const,
          variables: [{ name: 'LOGIN', description: 'the QA login' }],
        }),
      );

      window.qazinho = { ...fakeQazinhoApi('darwin'), copyVariables };
      useWorkspaceStore.setState({
        workspaces: [makeWorkspace(), { ...makeWorkspace([]), id: 'empty' }],
      });

      const { result } = pane();

      act(() => {
        result.current.onCopy();
      });

      await waitFor(() => {
        expect(useAppStore.getState().editingProjectId).not.toBe('p1');
      });

      const copy = useAppStore.getState().projects[1];

      expect(copy?.name).toBe('Loja · copy');
      expect(useAppStore.getState().projectSection).toBe('pro');
      expect(
        useWorkspaceStore
          .getState()
          .workspaces.filter(({ projectId }) => projectId === copy?.id),
      ).toHaveLength(1);
      expect(copyVariables).toHaveBeenCalledWith({ from: 'p1', to: copy?.id });
      expect(useVariablesStore.getState().byProject[copy?.id ?? '']).toEqual([
        { name: 'LOGIN', description: 'the QA login' },
      ]);
    });
  });

  describe('a link the org let go', () => {
    it('offers publishing a project the org deleted again, to the same org', async () => {
      const publishPro = vi.fn((props: { orgSlug: string; hasHistoryMedia: boolean }) =>
        Promise.resolve({ ...LINKED, orgSlug: props.orgSlug }),
      );

      window.qazinho = { ...fakeQazinhoApi('darwin'), publishPro };
      useProStore.setState({ shares: [{ ...LINKED, state: 'gone' }] });

      const { result } = pane();

      expect(result.current).toMatchObject({
        isUnlinked: true,
        isLinked: false,
        unlinked: {
          canPublishAgain: true,
          text: 'This project is no longer in Loja Online. Publish it again, or unlink it.',
        },
      });

      act(() => {
        result.current.onPublishAgain();
      });

      await waitFor(() => {
        expect(publishPro).toHaveBeenCalledTimes(1);
      });
      expect(publishPro.mock.calls[0]?.[0]).toMatchObject({
        orgSlug: 'loja',
        hasHistoryMedia: true,
      });
    });

    it('does NOT offer publishing again to an org this person no longer reaches', () => {
      useProStore.setState({ shares: [{ ...LINKED, state: 'no-access' }] });

      expect(pane().result.current.unlinked.canPublishAgain).toBe(false);
    });
  });
});
