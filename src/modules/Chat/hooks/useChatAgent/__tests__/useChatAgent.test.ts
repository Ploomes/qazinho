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

/** Uma bridge cujo agente responde todo pedido com o turno que recebe. */
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
      story: null,
      page: null,
      followed: [],
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
          jira: null,
          confluence: null,
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
          jira: null,
          confluence: null,
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
          jira: null,
          confluence: null,
        });
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          text: 'Claude Code is signed out. Sign it in from Settings → Agent, then ask again.',
        });
      });
    });

    it('says which story Jira did not hand over, and why', async () => {
      answering({
        isError: true,
        failure: { reason: 'jira', failure: 'not-found', key: 'SHOP-99' },
      });

      const { result } = renderHook(() => useChatAgent());

      act(() => {
        result.current.askAgent({
          workspaceId: 'w1',
          text: 'Plan SHOP-99',
          references: [],
          code: null,
          jira: { key: 'SHOP-99' },
          confluence: null,
        });
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          text: 'QAzinho could not read SHOP-99 from Jira. Jira did not find it, or this account cannot see it.',
        });
      });
    });

    it('says Confluence did not hand the page over, in its own words', async () => {
      answering({
        isError: true,
        failure: { reason: 'confluence', failure: 'not-found', said: 'Page not found' },
      });

      const { result } = renderHook(() => useChatAgent());

      act(() => {
        result.current.askAgent({
          workspaceId: 'w1',
          text: 'Plan from the page',
          references: [],
          code: null,
          jira: null,
          confluence: { pageId: '98304' },
        });
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          text: 'QAzinho could not read the page from Confluence. Confluence did not find it, or this account cannot see it.',
        });
      });
    });

    it('asks with the story and keeps it as what the workspace works from once the plan lands', async () => {
      const ask = answering({
        answer: DRAFTED,
        story: {
          key: 'SHOP-12',
          summary: 'Aplicar cupom',
          url: 'https://acme.atlassian.net/browse/SHOP-12',
        },
      });
      const { result } = renderHook(() => useChatAgent());

      act(() => {
        result.current.askAgent({
          workspaceId: 'w1',
          text: 'Plan the tests for the Jira story SHOP-12: Aplicar cupom.',
          references: [],
          code: null,
          jira: { key: 'SHOP-12' },
          confluence: null,
        });
      });

      expect(ask.mock.calls[0]?.[0].jira).toEqual({ key: 'SHOP-12' });
      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.issue).toEqual({
          key: 'SHOP-12',
          title: 'Aplicar cupom',
          source: 'jira',
          url: 'https://acme.atlassian.net/browse/SHOP-12',
        });
      });
    });

    it('asks with the page and keeps it as where the plan came from once the plan lands', async () => {
      const page = {
        id: '98304',
        title: 'Checkout: cenários',
        space: 'QA',
        url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
      };
      const ask = answering({ answer: DRAFTED, page });
      const { result } = renderHook(() => useChatAgent());

      act(() => {
        result.current.askAgent({
          workspaceId: 'w1',
          text: 'Plan the tests from the Confluence page “Checkout: cenários”.',
          references: [],
          code: null,
          jira: null,
          confluence: { pageId: '98304' },
        });
      });

      expect(ask.mock.calls[0]?.[0].confluence).toEqual({ pageId: '98304' });
      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.sourcePage).toEqual(page);
      });
    });
  });
});
