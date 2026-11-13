// @vitest-environment jsdom
import type { IAgentEvent, IDetectedAgent, ISetupEvent } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineWatch } from '@/shared/hooks/useMachineWatch';
import { MACHINE_WATCH } from '@/shared/hooks/useMachineWatch/constants';
import {
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

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
  axe: { isFound: false, path: null },
};

beforeEach(() => {
  useMachineStore.setState({
    agents: [],
    resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
    tools: {
      androidSdk: { isFound: false, path: null },
      xcode: { isFound: false, path: null },
      axe: { isFound: false, path: null },
    },
    hasDetected: false,
    usage: null,
  });
  useSettingsStore.setState({ agent: 'Claude Code' });

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    detectAgents: vi.fn().mockResolvedValue(AGENTS),
    readResources: vi.fn().mockResolvedValue(RESOURCES),
    detectDeviceTools: vi.fn().mockResolvedValue(TOOLS),
    onAgentEvent: vi.fn().mockReturnValue(() => undefined),
    readState: vi.fn().mockResolvedValue({ projects: '[]', workspaces: [] }),
    onSetupEvent: vi.fn().mockReturnValue(() => undefined),
    listIntegrations: vi.fn().mockResolvedValue([]),
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

const KNOWN: IDetectedAgent[] = AGENTS.map((agent) => ({ ...agent, isSignedIn: true }));

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

  /**
   * A barra de título mantinha "71% da sessão · reseta 08:00" muito depois das oito: os
   * limites só vinham com a resposta de um agente, então congelavam enquanto nada rodava.
   */
  it("reads the agent's limits once it is known, then every five minutes, keeping the context", async () => {
    vi.useFakeTimers();

    const limits = vi.fn((_: string) =>
      Promise.resolve({
        fiveHourUsed: 0.03,
        sevenDayUsed: 0.25,
        resetsAt: 1_792_600_000,
      }),
    );

    window.qazinho.readAgentLimits = limits;
    useMachineStore.setState({
      agents: KNOWN,
      usage: {
        fiveHourUsed: 0.71,
        sevenDayUsed: 0.24,
        resetsAt: 1_792_580_000,
        contextTokens: 9_000,
        contextWindow: 200_000,
      },
    });

    renderHook(() => useMachineWatch());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(limits).toHaveBeenCalledWith('claude-code');
    expect(useMachineStore.getState().usage).toEqual({
      fiveHourUsed: 0.03,
      sevenDayUsed: 0.25,
      resetsAt: 1_792_600_000,
      contextTokens: 9_000,
      contextWindow: 200_000,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MACHINE_WATCH.limitsMs);
    });

    expect(limits).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('reads the limits again when the window comes back, but not on every glance', async () => {
    vi.useFakeTimers();

    const limits = vi.fn((_: string) => Promise.resolve(null));

    window.qazinho.readAgentLimits = limits;
    useMachineStore.setState({ agents: KNOWN });

    renderHook(() => useMachineWatch());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    window.dispatchEvent(new Event('focus'));

    expect(limits).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MACHINE_WATCH.limitsFocusMs);
    });
    window.dispatchEvent(new Event('focus'));

    expect(limits).toHaveBeenCalledTimes(2);
    expect(useMachineStore.getState().usage).toBeNull();

    vi.useRealTimers();
  });

  it('does NOT ask for limits before it knows which agent the QA uses', () => {
    const limits = vi.fn((_: string) => Promise.resolve(null));

    window.qazinho.readAgentLimits = limits;
    window.qazinho.detectAgents = vi.fn(
      () => new Promise<IDetectedAgent[]>(() => undefined),
    );

    renderHook(() => useMachineWatch());

    expect(limits).not.toHaveBeenCalled();
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

  it('follows a phone being opened to look at the app, and lets go once the agent answers', () => {
    let hear: (event: IAgentEvent) => void = () => undefined;

    window.qazinho.onAgentEvent = vi.fn((listener: (event: IAgentEvent) => void) => {
      hear = listener;

      return () => undefined;
    });
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()], lookingAt: {} });

    renderHook(() => useMachineWatch());

    hear({ kind: 'look', workspaceId: 'w1', device: 'android' });

    expect(useWorkspaceStore.getState().lookingAt).toEqual({ w1: 'android' });

    hear({ kind: 'text', workspaceId: 'w1', text: 'Vi a tela inicial' });

    expect(useWorkspaceStore.getState().lookingAt).toEqual({});
  });

  it('follows a branch being copied for the agent, and lets go once it answers', () => {
    let hear: (event: IAgentEvent) => void = () => undefined;

    window.qazinho.onAgentEvent = vi.fn((listener: (event: IAgentEvent) => void) => {
      hear = listener;

      return () => undefined;
    });
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()], readSteps: {} });

    renderHook(() => useMachineWatch());

    hear({ kind: 'code', workspaceId: 'w1', step: 'download', bytes: 2048 });

    expect(useWorkspaceStore.getState().readSteps).toEqual({
      w1: { step: 'download', bytes: 2048 },
    });

    hear({ kind: 'text', workspaceId: 'w1', text: 'Reading the diff' });

    expect(useWorkspaceStore.getState().readSteps).toEqual({});
  });

  it('follows a Jira story being read for the agent', () => {
    let hear: (event: IAgentEvent) => void = () => undefined;

    window.qazinho.onAgentEvent = vi.fn((listener: (event: IAgentEvent) => void) => {
      hear = listener;

      return () => undefined;
    });
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()], readSteps: {} });

    renderHook(() => useMachineWatch());

    hear({ kind: 'jira', workspaceId: 'w1', step: 'files', bytes: 4096 });

    expect(useWorkspaceStore.getState().readSteps).toEqual({
      w1: { step: 'files', bytes: 4096 },
    });
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
      installs: { axe: { phase: 'installing', stage: 1, stages: 4, line: '' } },
    });

    renderHook(() => useMachineWatch());

    hear({ item: 'axe', stage: 2, stages: 4, line: '==> Pouring' });

    expect(useSetupStore.getState().installs.axe).toEqual({
      phase: 'installing',
      stage: 2,
      stages: 4,
      line: '==> Pouring',
    });
  });
});
