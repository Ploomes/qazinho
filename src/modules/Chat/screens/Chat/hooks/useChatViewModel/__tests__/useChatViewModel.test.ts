// @vitest-environment jsdom
import type { IAgentTurn, IAskAgent } from '@/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatViewModel } from '@/modules/Chat/screens/Chat/hooks/useChatViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeGocrashApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
};

const DRAFTED = JSON.stringify({
  summary: 'Two cases over the checkout.',
  cases: [
    {
      title: 'Checkout with a test card',
      priority: 'P1',
      goal: 'A card order goes through.',
      preconditions: 'One product in the cart.',
      steps: [{ action: 'Pay with the test card', expected: 'A confirmation appears' }],
    },
  ],
});

function answering(turn: Partial<IAgentTurn>) {
  const ask = vi.fn((_: IAskAgent): Promise<IAgentTurn> =>
    Promise.resolve({
      sessionId: 'session-1',
      text: '',
      usage: null,
      isError: false,
      ...turn,
    }),
  );

  window.gocrash = { ...fakeGocrashApi('darwin'), askAgent: ask };

  return ask;
}

beforeEach(() => {
  useAppStore.setState({ projects: [PROJECT], selectedWorkspaceId: 'w1' });
  useSettingsStore.setState({ agent: 'Claude Code', model: 'sonnet' });
  useMachineStore.setState({
    agents: [
      {
        id: 'claude-code',
        name: 'Claude Code',
        command: 'claude',
        isFound: true,
        path: '/bin/claude',
      },
    ],
  });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace([])], isAgentTyping: false });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'gocrash');
});

describe('useChatViewModel', () => {
  it('opens empty, with the suggestions the QA can start from', () => {
    answering({});

    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.suggestions).toHaveLength(2);
  });

  it('names the target the run would go to', () => {
    answering({});

    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.targetLabel).toBe('Web · https://shop.test');
  });

  describe('onSend', () => {
    it("asks the QA's own agent, on the model they picked", async () => {
      const ask = answering({ text: DRAFTED });
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Test the whole checkout');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0]).toMatchObject({
        agentId: 'claude-code',
        model: 'sonnet',
        workspaceId: 'w1',
      });
    });

    it('turns the first answer into the plan, and remembers the session', async () => {
      answering({ text: DRAFTED });
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Test the whole checkout');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.plan).toHaveLength(1);
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.sessionId).toBe('session-1');
      expect(useWorkspaceStore.getState().isAgentTyping).toBe(false);
    });

    it('does NOT ask for a plan again once the workspace has one', async () => {
      const ask = answering({ text: 'Noted.' });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Change the second case');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].schema).toBeUndefined();
      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'agent',
          text: 'Noted.',
        });
      });
    });

    it('shows a gocrash error when the agent breaks, never a verdict', async () => {
      answering({ isError: true, text: 'claude: command not found' });
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Test it');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'error',
        });
      });
    });

    it('says so when the answer is not a plan it can read', async () => {
      answering({ text: 'I would rather not.' });
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Test it');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'error',
        });
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.plan).toHaveLength(0);
    });

    it('does NOT send an empty draft', () => {
      const ask = answering({});
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSend();
      });

      expect(ask).not.toHaveBeenCalled();
    });
  });
});
