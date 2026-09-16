// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAT } from '@/modules/Chat/screens/Chat/constants';
import { useChatViewModel } from '@/modules/Chat/screens/Chat/hooks/useChatViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
};

beforeEach(() => {
  vi.useFakeTimers();
  useAppStore.setState({ projects: [PROJECT], selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace([])], isAgentTyping: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useChatViewModel', () => {
  it('opens empty, with the suggestions the QA can start from', () => {
    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.suggestions).toHaveLength(2);
  });

  it('names the target the run would go to', () => {
    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.targetLabel).toBe('Web · https://shop.test');
  });

  describe('onSend', () => {
    it('puts the message in the chat and waits for the agent', () => {
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Test the whole checkout');
      });
      act(() => {
        result.current.onSend();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.chat).toHaveLength(1);
      expect(useWorkspaceStore.getState().isAgentTyping).toBe(true);
    });

    it('gets the plan back once the agent has read it', () => {
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Test the whole checkout');
      });
      act(() => {
        result.current.onSend();
      });
      act(() => {
        vi.advanceTimersByTime(CHAT.replyDelayMs);
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan).toHaveLength(4);
      expect(useWorkspaceStore.getState().isAgentTyping).toBe(false);
    });

    it('does NOT send an empty draft', () => {
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSend();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.chat).toHaveLength(0);
    });

    it('clears the draft, so the same message cannot go twice', () => {
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Test the whole checkout');
      });
      act(() => {
        result.current.onSend();
      });

      expect(result.current.draft).toBe('');
    });
  });
});
