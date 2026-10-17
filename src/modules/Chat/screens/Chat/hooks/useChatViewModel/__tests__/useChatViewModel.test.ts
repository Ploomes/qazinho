// @vitest-environment jsdom
import type { IAgentTurn, IAskAgent } from '@/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatViewModel } from '@/modules/Chat/screens/Chat/hooks/useChatViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
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
  reply: 'Two cases over the checkout.',
  plan: {
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
  },
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

  window.qazinho = { ...fakeQazinhoApi('darwin'), askAgent: ask };

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
        defaultModel: null,
      },
    ],
  });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace([])], isAgentTyping: false });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useChatViewModel', () => {
  it('opens empty, with the suggestions the QA can start from', () => {
    answering({});

    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.suggestions).toHaveLength(2);
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
        text: 'Test the whole checkout',
        target: { kind: 'web', value: 'https://shop.test' },
        steps: [],
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

    it('talks without touching the plan when the answer carries none', async () => {
      const ask = answering({ text: JSON.stringify({ reply: '1 + 1 is 2.' }) });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('how much is 1 + 1');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'agent',
          who: 'Claude Code',
          text: '1 + 1 is 2.',
        });
      });
      expect(ask.mock.calls[0]?.[0].steps).toHaveLength(6);
      expect(useWorkspaceStore.getState().workspaces[0]?.plan).toHaveLength(2);
    });

    it('hands the agent what the QA mentioned, and keeps the mention on the message', async () => {
      const ask = answering({ text: JSON.stringify({ reply: 'It checks out.' }) });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('what does @TC-01 prove? and @TC-09?');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].references.map(({ id }) => id)).toEqual(['TC-01']);
      expect(useWorkspaceStore.getState().workspaces[0]?.chat[0]).toMatchObject({
        kind: 'user',
        mentions: ['TC-01'],
      });
    });

    it('shows a QAzinho error when the agent breaks, never a verdict', async () => {
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

    it('says so when the answer is not in a shape it can read', async () => {
      answering({ text: JSON.stringify({ verdict: 'passed' }) });
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

  describe('mentions', () => {
    it('offers what the @ being typed could point at', () => {
      answering({});
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('explain @TC-0');
      });

      expect(result.current.mentions.map(({ id }) => id)).toEqual(['TC-01', 'TC-02']);
    });

    it('offers nothing while the QA is not mentioning', () => {
      answering({});
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('explain TC-0');
      });

      expect(result.current.mentions).toEqual([]);
    });

    it('completes the draft with the reference the QA picked', () => {
      answering({});
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('explain @TC');
      });
      act(() => {
        result.current.onPickMention('TC-02');
      });

      expect(result.current.draft).toBe('explain @TC-02 ');
    });
  });
});
