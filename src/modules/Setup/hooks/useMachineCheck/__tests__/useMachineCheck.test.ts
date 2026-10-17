// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMachineCheck } from '@/modules/Setup/hooks/useMachineCheck';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSetupStore } from '@/store';

const AGENT = {
  id: 'codex',
  name: 'Codex',
  command: 'codex',
  isFound: true,
  path: '/bin/codex',
  defaultModel: null,
};

beforeEach(() => {
  useSetupStore.setState({ managers: null, isChecking: false });
  useMachineStore.setState({ agents: [] });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    checkMachine: vi.fn().mockResolvedValue({
      agents: [AGENT],
      tools: {
        androidSdk: { isFound: true, path: '/sdk' },
        xcode: { isFound: false, path: null },
        idb: { isFound: false, path: null },
      },
      managers: {
        npm: { isFound: true, path: '/bin/npm' },
        brew: { isFound: false, path: null },
      },
    }),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useMachineCheck', () => {
  it('lands the agents, the tools and the package managers it found', async () => {
    const { result } = renderHook(() => useMachineCheck());

    await act(() => result.current.check());

    expect(useMachineStore.getState().agents).toEqual([AGENT]);
    expect(useMachineStore.getState().tools.androidSdk.isFound).toBe(true);
    expect(useSetupStore.getState().managers?.brew.isFound).toBe(false);
  });

  it('says it is checking until the machine answers, and not after', async () => {
    const { result } = renderHook(() => useMachineCheck());
    let checking: Promise<void> = Promise.resolve();

    act(() => {
      checking = result.current.check();
    });

    expect(result.current.isChecking).toBe(true);

    await act(() => checking);

    expect(result.current.isChecking).toBe(false);
  });
});
