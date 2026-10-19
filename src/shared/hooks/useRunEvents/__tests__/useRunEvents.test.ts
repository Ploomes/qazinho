// @vitest-environment jsdom
import type { IRunEvent, IRunInFlight } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace, WALKED_BY } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useRunEvents } from '@/shared/hooks/useRunEvents';
import { useMachineStore, useWorkspaceStore } from '@/store';

const RUN: IRunInFlight = {
  workspaceId: 'w1',
  runId: 'r-03',
  startedAtMs: Date.now() - 60_000,
  doingIndex: 1,
  streamUrl: 'http://127.0.0.1:5000/t/w1',
  outcomes: [],
  isPaused: false,
  costUsd: 0.12,
  findings: [],
  agentId: 'claude-code',
  model: 'sonnet',
  targetKind: 'web',
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
        costUsd: 0.12,
      });
    });
    expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
  });

  it('picks the run up with the agent and model main walks it with, as the QA calls them', async () => {
    bridgeWithRunInFlight();
    useMachineStore.setState({
      agents: [
        {
          id: 'claude-code',
          name: 'Claude Code',
          command: 'claude',
          isFound: true,
          path: '/usr/local/bin/claude',
          defaultModel: null,
          isSignedIn: true,
        },
      ],
    });

    renderHook(() => {
      useRunEvents();
    });
    useWorkspaceStore.setState({ isLoaded: true });

    await waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces[0]?.live?.by).toEqual({
        agent: 'Claude Code',
        modelName: 'Sonnet',
        targetKind: 'web',
      });
    });
    useMachineStore.setState({ agents: [] });
  });

  /**
   * A run that could not open the app used to land Playwright's own words in the chat:
   * "page.goto: net::ERR_UNSAFE_PORT … Call log: …", in English whatever the QA reads.
   */
  it("says why a run stopped in the QA's language, with the address it could not open", async () => {
    let send: (event: IRunEvent) => void = () => undefined;

    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      onRunEvent: (listener) => {
        send = listener;

        return () => undefined;
      },
    };
    useWorkspaceStore.setState({
      workspaces: [
        startRun({
          workspace: makeWorkspace(),
          startedAt: '09:41',
          runId: 'r-01',
          by: WALKED_BY,
        }),
      ],
    });
    await i18n.changeLanguage('pt');

    renderHook(() => {
      useRunEvents();
    });

    act(() => {
      send({
        kind: 'failed',
        workspaceId: 'w1',
        failure: {
          reason: 'unreachable',
          url: 'http://127.0.0.1:3000/',
          code: 'ERR_CONNECTION_REFUSED',
        },
      });
    });

    expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
      kind: 'error',
      text: 'O Chrome não conseguiu abrir http://127.0.0.1:3000/ (ERR_CONNECTION_REFUSED). Confira se o app está no ar e se esta máquina o alcança, e rode o plano de novo.',
    });
    await i18n.changeLanguage('en');
  });
});
