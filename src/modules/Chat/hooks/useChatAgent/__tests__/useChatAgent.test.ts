// @vitest-environment jsdom
import type { IAskAgent, IChatAnswer, IChatTurn } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useChatAgent } from '@/modules/Chat/hooks/useChatAgent';
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
  repositories: [],
};

const DRAFTED: IChatAnswer = {
  reply: 'One case over the checkout.',
  questions: [],
  plan: {
    summary: 'One case over the checkout.',
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
};

/** A bridge whose agent answers every ask with the turn handed to it. */
function answering(turn: Partial<IChatTurn>) {
  const ask = vi.fn((_: IAskAgent): Promise<IChatTurn> =>
    Promise.resolve({
      sessionId: 'session-1',
      text: '',
      usage: null,
      costUsd: null,
      isError: false,
      answer: null,
      failure: null,
      code: null,
      ...turn,
    }),
  );

  window.qazinho = { ...fakeQazinhoApi('darwin'), askAgent: ask };

  return ask;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useAppStore.setState({ projects: [PROJECT], selectedWorkspaceId: null });
  useSettingsStore.setState({ agent: 'Claude Code', model: 'sonnet' });
  useMachineStore.setState({ agents: [] });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace([])],
    askingIds: ['w1'],
    liveTexts: {},
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useChatAgent', () => {
  describe('askAgent', () => {
    it("asks a workspace's agent even when it is not on screen, and lands the plan it wrote", async () => {
      const ask = answering({ answer: DRAFTED });
      const { result } = renderHook(() => useChatAgent());

      act(() => {
        result.current.askAgent({
          workspaceId: 'w1',
          text: 'Plan the checkout',
          references: [],
          code: null,
        });
      });

      expect(ask.mock.calls[0]?.[0]).toMatchObject({
        workspaceId: 'w1',
        agentId: 'claude-code',
        model: 'sonnet',
        sessionId: null,
        text: 'Plan the checkout',
        target: { kind: 'web', value: 'https://shop.test' },
        viewport: { width: 1280, height: 800 },
        steps: [],
      });
      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.plan).toHaveLength(1);
      });
      expect(useWorkspaceStore.getState().askingIds).toEqual([]);
    });

    it('does NOT ask for a workspace that is gone', () => {
      const ask = answering({ answer: DRAFTED });
      const { result } = renderHook(() => useChatAgent());

      act(() => {
        result.current.askAgent({
          workspaceId: 'w-gone',
          text: 'Plan it',
          references: [],
          code: null,
        });
      });

      expect(ask).not.toHaveBeenCalled();
    });

    it('says in the chat why the agent could not answer', async () => {
      answering({ isError: true, failure: { reason: 'agent-signed-out' } });

      const { result } = renderHook(() => useChatAgent());

      act(() => {
        result.current.askAgent({
          workspaceId: 'w1',
          text: 'Plan it',
          references: [],
          code: null,
        });
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          text: 'Claude Code is signed out. Sign it in from Settings → Agents, then ask again.',
        });
      });
    });
  });
});
