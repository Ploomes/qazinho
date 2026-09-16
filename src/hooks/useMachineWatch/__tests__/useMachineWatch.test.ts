// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMachineWatch } from '@/hooks/useMachineWatch';
import { MACHINE_WATCH } from '@/hooks/useMachineWatch/constants';
import { useMachineStore } from '@/store';

const AGENTS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    isFound: true,
    path: '/bin/claude',
  },
];

const RESOURCES = { cpu: 12.5, ramMb: 2048, ramCeilingGb: 64, processes: [] };

const TOOLS = {
  androidSdk: { isFound: true, path: '/Users/qa/Library/Android/sdk' },
  xcode: { isFound: false, path: null },
};

beforeEach(() => {
  useMachineStore.setState({
    agents: [],
    resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
    tools: {
      androidSdk: { isFound: false, path: null },
      xcode: { isFound: false, path: null },
    },
    hasDetected: false,
  });

  window.gocrash = {
    platform: 'darwin',
    detectAgents: vi.fn().mockResolvedValue(AGENTS),
    readResources: vi.fn().mockResolvedValue(RESOURCES),
    detectDeviceTools: vi.fn().mockResolvedValue(TOOLS),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'gocrash');
});

describe('useMachineWatch', () => {
  it('asks the machine which agents are installed, once', async () => {
    renderHook(() => useMachineWatch());

    await waitFor(() => {
      expect(useMachineStore.getState().agents).toEqual(AGENTS);
    });
    expect(window.gocrash.detectAgents).toHaveBeenCalledTimes(1);
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

    expect(window.gocrash.readResources).toHaveBeenCalledTimes(3);

    unmount();
    vi.advanceTimersByTime(MACHINE_WATCH.pollMs * 2);

    expect(window.gocrash.readResources).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
