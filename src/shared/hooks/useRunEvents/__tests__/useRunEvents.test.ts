// @vitest-environment jsdom
import type { IRunInFlight } from '@/shared/types';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useRunEvents } from '@/shared/hooks/useRunEvents';
import { useWorkspaceStore } from '@/store';

const RUN: IRunInFlight = {
  workspaceId: 'w1',
  runId: 'r-03',
  startedAtMs: Date.now() - 60_000,
  doingIndex: 1,
  streamUrl: 'http://127.0.0.1:5000/t/w1',
  outcomes: [],
  isPaused: false,
};

/** A page that opened while main was still walking a run: the bridge says so. */
function bridgeWithRunInFlight() {
  const runsInFlight = vi.fn(() => Promise.resolve([RUN]));

  window.qazinho = { ...fakeQazinhoApi('darwin'), runsInFlight };

  return runsInFlight;
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()], isLoaded: false });
});

describe('useRunEvents', () => {
  it('picks up a run main is still walking, once the workspaces are read from disk', async () => {
    const runsInFlight = bridgeWithRunInFlight();

    renderHook(() => {
      useRunEvents();
    });

    expect(runsInFlight).not.toHaveBeenCalled();

    useWorkspaceStore.setState({ isLoaded: true });

    await waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces[0]?.live).toMatchObject({
        id: 'r-03',
        doingIndex: 1,
        isRunning: true,
        streamUrl: 'http://127.0.0.1:5000/t/w1',
      });
    });
    expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
  });
});
