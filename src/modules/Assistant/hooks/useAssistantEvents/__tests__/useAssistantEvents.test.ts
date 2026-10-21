// @vitest-environment jsdom
import type { IAgentEvent } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAssistantEvents } from '@/modules/Assistant/hooks/useAssistantEvents';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAssistantStore, useMachineStore } from '@/store';

/** The assistant's agent events, as main sends them on their own channel. */
function bridge() {
  let hear: (event: IAgentEvent) => void = () => undefined;

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    onAssistantEvent: (listener) => {
      hear = listener;

      return () => undefined;
    },
  };

  return { send: (event: IAgentEvent) => hear(event) };
}

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useAssistantEvents', () => {
  it('shows what the assistant is saying while it still answers', () => {
    const { send } = bridge();

    renderHook(() => {
      useAssistantEvents();
    });
    act(() => {
      send({ kind: 'text', workspaceId: '~assistant', text: 'Abrindo o Checkout…' });
    });

    expect(useAssistantStore.getState().liveText).toBe('Abrindo o Checkout…');
  });

  it("keeps the agent's usage meter up to date, as any of its turns does", () => {
    const { send } = bridge();
    const usage = {
      fiveHourUsed: 0.4,
      sevenDayUsed: 0.1,
      resetsAt: 0,
      contextTokens: 1200,
      contextWindow: 200_000,
    };

    renderHook(() => {
      useAssistantEvents();
    });
    act(() => {
      send({ kind: 'usage', workspaceId: '~assistant', usage });
    });

    expect(useMachineStore.getState().usage).toEqual(usage);
  });
});
