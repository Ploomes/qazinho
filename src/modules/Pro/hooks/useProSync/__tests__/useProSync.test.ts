// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import type { IProShare, IProSyncBatch, ProStatus } from '@/shared/types';
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
  isReachable: true,
};
const SHARE: IProShare = {
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: null,
  pending: [],
  conflicts: [],
};
const PROJECT: IProject = {
  id: 'p1',
  name: 'Loja',
  targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://loja.dev' }],
  repositories: [],
};
const LOCAL: IProject = { ...PROJECT, id: 'p2', name: 'Pessoal' };
const WORKSPACE = recordedRun(['passed', 'failed']);

let synced: IProSyncBatch[] = [];
let listed: string[] = [];
let announce: (share: IProShare) => void = () => undefined;

/**
 * Uma bridge cuja main guarda os compartilhamentos dados, e guarda todo batch que a
 * página lhe entrega.
 */
function bridgeWith(props: { status: ProStatus; shares?: IProShare[] }) {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    proStatus: () => Promise.resolve(props.status),
    proShares: () => Promise.resolve(props.shares ?? [SHARE]),
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

      return Promise.resolve({ isListed: true, projects: [] });
    },
  };
}

async function mounted(isOn = true) {
  const hook = renderHook(() => {
    useProSync(isOn);
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
  useProStore.setState({ status: null, shares: [] });
  useAppStore.setState({ projects: [PROJECT, LOCAL] });
  useWorkspaceStore.setState({ workspaces: [WORKSPACE], isLoaded: true });
  bridgeWith({ status: SIGNED_IN });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProSync', () => {
  it('reads no account and sends nothing while the Pro is off', async () => {
    await mounted(false);
    await settle();

    expect(synced).toEqual([]);
    expect(useProStore.getState().status).toBeNull();
  });

  it('sends a linked project once the machine is signed in, after the burst settles', async () => {
    await mounted();

    expect(synced).toEqual([]);

    await settle();

    expect(synced.map(({ project }) => project.projectId)).toEqual(['p1']);
    expect(synced[0]?.runs.map(({ runId }) => runId)).toEqual(['r-01']);
  });

  it('does NOT send a project never published, even signed in', async () => {
    bridgeWith({ status: SIGNED_IN, shares: [] });
    await mounted();
    await settle();

    expect(synced).toEqual([]);
  });

  it('does NOT send while the machine is signed out', async () => {
    bridgeWith({ status: { isSignedIn: false, canKeepToken: true } });
    await mounted();
    await settle();

    expect(synced).toEqual([]);
  });

  it('does NOT send a project the org no longer has', async () => {
    bridgeWith({ status: SIGNED_IN, shares: [{ ...SHARE, state: 'gone' }] });
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

  it('sends a project once it is linked to an org, and again once linked to another', async () => {
    bridgeWith({ status: SIGNED_IN, shares: [] });
    await mounted();
    await settle();

    expect(synced).toEqual([]);

    act(() => {
      announce(SHARE);
    });
    await settle();

    expect(synced).toHaveLength(1);

    act(() => {
      announce({ ...SHARE, orgSlug: 'outra' });
    });
    await settle();

    expect(synced).toHaveLength(2);
  });

  it('reads no org’s projects on its own', async () => {
    await mounted();
    await settle();

    expect(listed).toEqual([]);
  });

  it('lands each state main announces', async () => {
    await mounted();

    act(() => {
      announce({ ...SHARE, state: 'blocked' });
    });

    expect(useProStore.getState().shares).toEqual([{ ...SHARE, state: 'blocked' }]);
  });
});
