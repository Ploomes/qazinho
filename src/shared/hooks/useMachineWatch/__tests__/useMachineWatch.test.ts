// @vitest-environment jsdom
import type { IAgentEvent, ISetupEvent } from '@/shared/types';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useMachineWatch } from '@/shared/hooks/useMachineWatch';
import { MACHINE_WATCH } from '@/shared/hooks/useMachineWatch/constants';
import { useMachineStore, useSetupStore, useWorkspaceStore } from '@/store';

const AGENTS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    isFound: true,
    path: '/bin/claude',
    defaultModel: null,
  },
];

const RESOURCES = { cpu: 12.5, ramMb: 2048, ramCeilingGb: 64, processes: [] };

const TOOLS = {
  androidSdk: { isFound: true, path: '/Users/qa/Library/Android/sdk' },
  xcode: { isFound: false, path: null },
  idb: { isFound: false, path: null },
};

beforeEach(() => {
  useMachineStore.setState({
    agents: [],
    resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
    tools: {
      androidSdk: { isFound: false, path: null },
      xcode: { isFound: false, path: null },
      idb: { isFound: false, path: null },
    },
    hasDetected: false,
  });

  window.qazinho = {
    platform: 'darwin',
    detectAgents: vi.fn().mockResolvedValue(AGENTS),
    readResources: vi.fn().mockResolvedValue(RESOURCES),
    detectDeviceTools: vi.fn().mockResolvedValue(TOOLS),
    askAgent: vi.fn(),
    stopAgent: vi.fn(),
    onAgentEvent: vi.fn().mockReturnValue(() => undefined),
    signInAgent: vi.fn(),
    cancelAgentSignIn: vi.fn(),
    sendAgentSignInCode: vi.fn(),
    onAgentSignIn: vi.fn().mockReturnValue(() => undefined),
    startRun: vi.fn(),
    pauseRun: vi.fn(),
    stopRun: vi.fn(),
    runsInFlight: vi.fn(),
    resizeDevice: vi.fn(),
    focusDevice: vi.fn(),
    onRunEvent: vi.fn().mockReturnValue(() => undefined),
    replayUrl: vi.fn(),
    saveReplay: vi.fn(),
    alertRunEnded: vi.fn(),
    onOpenRun: vi.fn().mockReturnValue(() => undefined),
    readState: vi.fn().mockResolvedValue({ projects: '[]', workspaces: [] }),
    saveProjects: vi.fn(),
    saveWorkspace: vi.fn(),
    removeWorkspace: vi.fn(),
    readShot: vi.fn().mockResolvedValue(null),
    saveShot: vi.fn(),
    pickFile: vi.fn().mockResolvedValue(null),
    fitWindow: vi.fn(),
    checkMachine: vi.fn(),
    installTool: vi.fn(),
    onSetupEvent: vi.fn().mockReturnValue(() => undefined),
    listIntegrations: vi.fn().mockResolvedValue([]),
    connectIntegration: vi.fn(),
    disconnectIntegration: vi.fn(),
    listMcpServers: vi.fn(),
    connectMcpServer: vi.fn(),
    cancelMcpSignIn: vi.fn(),
    onMcpSignIn: vi.fn().mockReturnValue(() => undefined),
    removeMcpServer: vi.fn(),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useMachineWatch', () => {
  it('asks the machine which agents are installed, once', async () => {
    renderHook(() => useMachineWatch());

    await waitFor(() => {
      expect(useMachineStore.getState().agents).toEqual(AGENTS);
    });
    expect(window.qazinho.detectAgents).toHaveBeenCalledTimes(1);
  });

  it('reads the meters straight away, without waiting for the first tick', async () => {
    renderHook(() => useMachineWatch());

    await waitFor(() => {
      expect(useMachineStore.getState().resources.cpu).toBe(12.5);
    });
  });

  it('asks which toolchains are here, so the iOS target knows whether to switch on', async () => {
    renderHook(() => useMachineWatch());

    await waitFor(() => {
      expect(useMachineStore.getState().tools.androidSdk.isFound).toBe(true);
    });
    expect(useMachineStore.getState().tools.xcode.isFound).toBe(false);
  });

  it('keeps reading while it is mounted, and stops when it is not', async () => {
    vi.useFakeTimers();

    const { unmount } = renderHook(() => useMachineWatch());

    vi.advanceTimersByTime(MACHINE_WATCH.pollMs * 2);

    expect(window.qazinho.readResources).toHaveBeenCalledTimes(3);

    unmount();
    vi.advanceTimersByTime(MACHINE_WATCH.pollMs * 2);

    expect(window.qazinho.readResources).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('files the context window under the workspace the agent answered', () => {
    let hear: (event: IAgentEvent) => void = () => undefined;

    window.qazinho.onAgentEvent = vi.fn((listener: (event: IAgentEvent) => void) => {
      hear = listener;

      return () => undefined;
    });
    useWorkspaceStore.setState({
      workspaces: [makeWorkspace(), { ...makeWorkspace(), id: 'w2' }],
    });

    renderHook(() => useMachineWatch());

    hear({
      kind: 'usage',
      workspaceId: 'w2',
      usage: {
        fiveHourUsed: 0.3,
        sevenDayUsed: null,
        resetsAt: 0,
        contextTokens: 50_000,
        contextWindow: 200_000,
      },
    });

    const [first, second] = useWorkspaceStore.getState().workspaces;

    expect(first?.context).toBeNull();
    expect(second?.context).toEqual({ tokens: 50_000, window: 200_000 });
    expect(useMachineStore.getState().usage?.fiveHourUsed).toBe(0.3);
  });

  it('knows which trackers are connected from the start', async () => {
    window.qazinho.listIntegrations = vi
      .fn()
      .mockResolvedValue([
        { id: 'github', account: 'octoqa', site: null, connectedAt: '2026-09-16' },
      ]);

    renderHook(() => useMachineWatch());

    await waitFor(() => {
      expect(useSetupStore.getState().integrations).toMatchObject([
        { account: 'octoqa' },
      ]);
    });
  });

  it('follows an install line by line', () => {
    let hear: (event: ISetupEvent) => void = () => undefined;

    window.qazinho.onSetupEvent = vi.fn((listener: (event: ISetupEvent) => void) => {
      hear = listener;

      return () => undefined;
    });
    useSetupStore.setState({
      installs: { idb: { phase: 'installing', stage: 1, stages: 4, line: '' } },
    });

    renderHook(() => useMachineWatch());

    hear({ item: 'idb', stage: 2, stages: 4, line: '==> Pouring' });

    expect(useSetupStore.getState().installs.idb).toEqual({
      phase: 'installing',
      stage: 2,
      stages: 4,
      line: '==> Pouring',
    });
  });
});
