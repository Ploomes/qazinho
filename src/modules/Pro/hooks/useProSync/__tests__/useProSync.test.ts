// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import type { IProOrgProject, IProShare, IProSyncBatch, ProStatus } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProSync } from '@/modules/Pro/hooks';
import { recordedRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [{ slug: 'loja', name: 'Loja Online', role: 'editor', billingStatus: 'active' }],
  orgSlug: 'loja',
  isReachable: true,
};
const SHARE: IProShare = {
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: null,
  conflicts: [],
};
const PROJECT: IProject = {
  id: 'p1',
  name: 'Loja',
  targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://loja.dev' }],
  repositories: [],
};
const ORG_PROJECT: IProOrgProject = {
  orgSlug: 'loja',
  projectId: 'p-2',
  key: 'APP',
  name: 'App',
  plans: [],
};
const WORKSPACE = recordedRun(['passed', 'failed']);

let synced: IProSyncBatch[] = [];
let listed: string[] = [];
let announce: (share: IProShare) => void = () => undefined;

function bridgeWith(status: ProStatus) {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    proStatus: () => Promise.resolve(status),
    proShares: () => Promise.resolve([]),
    syncPro: (batch) => {
      synced.push(batch);

      return Promise.resolve({ ...SHARE, state: 'sending' });
    },
    onProSync: (listener) => {
      announce = listener;

      return () => {
        announce = () => undefined;
      };
    },
    listOrgProjects: (orgSlug) => {
      listed.push(orgSlug);

      return Promise.resolve({ isListed: true, projects: [ORG_PROJECT] });
    },
  };
}

async function mounted() {
  const hook = renderHook(() => {
    useProSync();
  });

  await act(async () => {
    await Promise.resolve();
  });

  return hook;
}

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2_000);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  synced = [];
  listed = [];
  useProStore.setState({ status: null, shares: [], orgProjects: [] });
  useAppStore.setState({ projects: [PROJECT] });
  useWorkspaceStore.setState({ workspaces: [WORKSPACE], isLoaded: true });
  bridgeWith(SIGNED_IN);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProSync', () => {
  it('sends every project once the machine is signed in, after the burst settles', async () => {
    await mounted();

    expect(synced).toEqual([]);

    await settle();

    expect(synced.map(({ project }) => project.projectId)).toEqual(['p1']);
    expect(synced[0]?.runs.map(({ runId }) => runId)).toEqual(['r-01']);
  });

  it('does NOT send while the machine is signed out, or has no org to send to', async () => {
    bridgeWith({ isSignedIn: false, canKeepToken: true });
    await mounted();
    await settle();

    expect(synced).toEqual([]);

    cleanup();
    bridgeWith({ ...SIGNED_IN, orgSlug: null });
    await mounted();
    await settle();

    expect(synced).toEqual([]);
  });

  it('sends again when the plan changes, but not when a live run’s clock ticks', async () => {
    await mounted();
    await settle();

    act(() => {
      useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, status: 'running' }] });
    });
    await settle();

    expect(synced).toHaveLength(1);

    act(() => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, plan: WORKSPACE.plan.slice(0, 1) }],
      });
    });
    await settle();

    expect(synced).toHaveLength(2);
    expect(synced[1]?.plans[0]?.cases).toHaveLength(1);
  });

  it('sends everything again once this computer sends to another org', async () => {
    await mounted();
    await settle();

    act(() => {
      useProStore.getState().setStatus({ ...SIGNED_IN, orgSlug: 'outra' });
    });
    await settle();

    expect(synced).toHaveLength(2);
  });

  it('reads the projects of the org it sends to', async () => {
    await mounted();

    expect(listed).toEqual(['loja']);
    expect(useProStore.getState().orgProjects).toEqual([ORG_PROJECT]);
  });

  it('lands each state main announces', async () => {
    await mounted();

    act(() => {
      announce({ ...SHARE, state: 'blocked' });
    });

    expect(useProStore.getState().shares).toEqual([{ ...SHARE, state: 'blocked' }]);
  });
});
