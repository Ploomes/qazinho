// @vitest-environment jsdom
import type { IIsland, IslandAction } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ISLAND } from '@/modules/Island/constants';
import { useIslandSync } from '@/modules/Island/hooks/useIslandSync';
import { endRun, startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { landAsked } from '@/modules/Workspace/library/landAsked';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

let sent: IIsland[] = [];
let heard: ((action: IslandAction) => void) | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  sent = [];
  heard = null;
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    setIsland: (island) => {
      sent.push(island);
    },
    onIslandAction: (listener) => {
      heard = listener;

      return () => undefined;
    },
  };
  useSettingsStore.setState({ isIslandOn: true, language: 'en' });
  useAppStore.setState({ selectedWorkspaceId: null });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

const begin = () =>
  startRun({
    workspace: makeWorkspace(),
    startedAt: '10:00',
    runId: 'r-01',
    by: WALKED_BY,
  });

describe('useIslandSync', () => {
  it('tells the island a run goes, in the language of the QA', () => {
    useWorkspaceStore.setState({ workspaces: [begin()] });
    renderHook(() => {
      useIslandSync();
    });

    expect(sent.at(-1)).toMatchObject({
      language: 'en',
      state: { kind: 'running', workspaceId: 'w1', done: 0, total: 6 },
    });
  });

  it('says the same thing once, not on every tick of the clock', () => {
    useWorkspaceStore.setState({ workspaces: [begin()] });
    renderHook(() => {
      useIslandSync();
    });

    const before = sent.length;

    act(() => {
      useWorkspaceStore.setState({ workspaces: [begin()] });
    });

    expect(sent.length).toBe(before);
  });

  it('shows the end of a run for a while, then lets the island go', () => {
    useWorkspaceStore.setState({ workspaces: [begin()] });
    renderHook(() => {
      useIslandSync();
    });
    act(() => {
      useWorkspaceStore.setState({
        workspaces: [endRun({ workspace: begin(), at: '10:05', endedBy: 'finished' })],
      });
    });

    expect(sent.at(-1)?.state).toMatchObject({ kind: 'ended', workspaceId: 'w1' });

    act(() => {
      vi.advanceTimersByTime(ISLAND.endedHoldMs);
    });

    expect(sent.at(-1)?.state).toEqual({ kind: 'idle' });
  });

  it('asks for the QA while the agent waits', () => {
    useWorkspaceStore.setState({
      workspaces: [landAsked({ workspace: begin(), question: QUESTION })],
    });
    renderHook(() => {
      useIslandSync();
    });

    expect(sent.at(-1)?.state).toMatchObject({ kind: 'asking' });
  });

  it('sends nothing but idle when the QA turned the island off', () => {
    useSettingsStore.setState({ isIslandOn: false });
    useWorkspaceStore.setState({ workspaces: [begin()] });
    renderHook(() => {
      useIslandSync();
    });

    expect(sent.every(({ state }) => state.kind === 'idle')).toBe(true);
  });

  it('opens the workspace the QA asked for in the island', () => {
    renderHook(() => {
      useIslandSync();
    });
    act(() => {
      heard?.({ kind: 'open', workspaceId: 'w1' });
    });

    expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
  });
});
