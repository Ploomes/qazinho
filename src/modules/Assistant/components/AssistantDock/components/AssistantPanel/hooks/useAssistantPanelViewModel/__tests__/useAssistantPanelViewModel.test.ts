// @vitest-environment jsdom
import type { IAssistantAsk, IAssistantTurn } from '@/shared/types';
import type { KeyboardEvent } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useAssistantPanelViewModel } from '@/modules/Assistant/components/AssistantDock/components/AssistantPanel/hooks/useAssistantPanelViewModel';
import { CHECKOUT, LOGIN, PROJECT } from '@/modules/Assistant/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useAssistantStore,
  useMachineStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

const ANSWERED: IAssistantTurn = {
  sessionId: 's-1',
  text: 'Abri o **Checkout**.',
  usage: null,
  costUsd: 0.01,
  isError: false,
  failure: null,
};

/**
 * Uma bridge cujo assistente responde cada pedido com o próximo turno que recebe, e
 * lembra todo pedido.
 */
function bridge(turns: IAssistantTurn[] = [ANSWERED]) {
  const asked: IAssistantAsk[] = [];

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    askAssistant: (ask) => {
      asked.push(ask);

      return Promise.resolve(turns.shift() ?? ANSWERED);
    },
    stopAssistant: vi.fn(() => Promise.resolve()),
  };

  return { asked };
}

const key = (props: { key: string; shiftKey?: boolean }) =>
  ({
    key: props.key,
    shiftKey: props.shiftKey ?? false,
    nativeEvent: { isComposing: false },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as KeyboardEvent<HTMLTextAreaElement>;

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useSettingsStore.setState({ agent: 'Claude Code', model: 'haiku', language: 'en' });
  useMachineStore.setState({ agents: [] });
  useAppStore.setState({
    projects: [PROJECT],
    screen: 'workspace',
    selectedWorkspaceId: 'w1',
    theme: 'dark',
  });
  useWorkspaceStore.setState({
    workspaces: [CHECKOUT, LOGIN],
    panelTab: 'runs',
    askingIds: [],
  });
  useAssistantStore.setState({
    isOpen: true,
    messages: [],
    isAsking: false,
    liveText: '',
    sessionId: null,
    sessionAgentId: null,
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useAssistantPanelViewModel', () => {
  describe('onSend', () => {
    it('asks with the QA words and QAzinho as it is now, then shows the answer', async () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('  Abre o Checkout ');
      });
      act(() => {
        result.current.onSend();
      });

      expect(result.current.draft).toBe('');
      expect(asked[0]).toMatchObject({
        agentId: 'claude-code',
        model: 'haiku',
        sessionId: null,
        text: 'Abre o Checkout',
        app: {
          screen: 'workspace',
          openWorkspaceId: 'w1',
          openTab: 'runs',
          openRunId: 'r-01',
        },
      });

      await waitFor(() => {
        expect(result.current.rows.map(({ kind }) => kind)).toEqual(['user', 'agent']);
      });
      expect(useAssistantStore.getState()).toMatchObject({
        sessionId: 's-1',
        sessionAgentId: 'claude-code',
        isAsking: false,
      });
    });

    it('does NOT send empty words, nor a second message while one is answered', () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('   ');
      });
      act(() => {
        result.current.onSend();
      });

      useAssistantStore.setState({ isAsking: true });
      act(() => {
        result.current.onDraft('Oi');
      });
      act(() => {
        result.current.onSend();
      });

      expect(asked).toEqual([]);
      expect(result.current.canSend).toBe(false);
    });

    it('goes on with the session it has, and starts another when the QA changed agent', async () => {
      const { asked } = bridge([ANSWERED, ANSWERED]);
      const { result } = renderHook(() => useAssistantPanelViewModel());

      useAssistantStore.setState({ sessionId: 's-0', sessionAgentId: 'claude-code' });
      act(() => {
        result.current.onDraft('Oi');
      });
      act(() => {
        result.current.onSend();
      });
      await waitFor(() => {
        expect(useAssistantStore.getState().isAsking).toBe(false);
      });

      useAssistantStore.setState({ sessionAgentId: 'codex' });
      act(() => {
        result.current.onDraft('E agora?');
      });
      act(() => {
        result.current.onSend();
      });

      expect(asked.map(({ sessionId }) => sessionId)).toEqual(['s-0', null]);
    });

    it('says why the assistant could not answer, in the QA words', async () => {
      bridge([
        { ...ANSWERED, isError: true, text: '', failure: { reason: 'agent-signed-out' } },
      ]);

      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('Oi');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(result.current.rows.at(-1)).toMatchObject({
          kind: 'error',
          text: 'Claude Code is signed out. Sign it in from Settings → Agents, then ask again.',
        });
      });
      expect(result.current).toMatchObject({
        status: 'something went wrong',
        mood: 'bug',
      });
    });

    it('does NOT repeat the last words the assistant already said before its tools', async () => {
      bridge([{ ...ANSWERED, text: 'Pronto, apaguei.' }]);

      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('Apaga o Login');
      });
      act(() => {
        result.current.onSend();
        useAssistantStore.setState({ liveText: 'Pronto, apaguei.' });
        useAssistantStore.getState().keepLiveText();
      });

      await waitFor(() => {
        expect(useAssistantStore.getState().isAsking).toBe(false);
      });
      expect(result.current.rows.map(({ kind }) => kind)).toEqual(['user', 'agent']);
    });

    it('takes a quiet end after the assistant did things, but says so when it said nothing at all', async () => {
      bridge([{ ...ANSWERED, text: '' }]);

      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('Oi');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(result.current.rows.at(-1)).toMatchObject({
          kind: 'error',
          text: 'The agent stopped answering. Ask it again.',
        });
      });
    });

    it('leaves a quiet line when the QA stopped the answer', async () => {
      bridge([{ ...ANSWERED, isError: true, text: '', failure: { reason: 'stopped' } }]);

      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('Apaga tudo');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(result.current.rows.at(-1)).toMatchObject({
          kind: 'note',
          text: 'You stopped the answer.',
        });
      });
    });
  });

  describe('onRemoveSecret', () => {
    it('holds a message with a token back, and takes the token out of it', () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('Conecta o Jira com ATATT3xFfGF0abc123def456 por favor');
      });
      act(() => {
        result.current.onSend();
      });

      expect(asked).toEqual([]);
      expect(result.current).toMatchObject({
        canSend: false,
        secretWarning:
          'This looks like a password or a token (ATATT3…). Neither goes in the chat: a token goes in Settings → Integrations, a password in the project’s variables.',
      });

      act(() => {
        result.current.onRemoveSecret();
      });

      expect(result.current).toMatchObject({
        draft: 'Conecta o Jira com por favor',
        secretWarning: '',
        canSend: true,
      });
    });
  });

  describe('onSendSecret', () => {
    it('sends the token only once the QA said so, and warns again for the next one', async () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('o token é ghp_a1b2c3d4e5f6g7h8i9j0k1l2');
      });
      act(() => {
        result.current.onSendSecret();
      });

      expect(result.current).toMatchObject({ secretWarning: '', canSend: true });

      act(() => {
        result.current.onSend();
      });

      expect(asked[0]?.text).toBe('o token é ghp_a1b2c3d4e5f6g7h8i9j0k1l2');
      await waitFor(() => {
        expect(useAssistantStore.getState().isAsking).toBe(false);
      });

      act(() => {
        result.current.onDraft('e esse ghp_zzzzzzzzzzzzzzzzzzzzzzzz');
      });

      expect(result.current.canSend).toBe(false);
    });
  });

  describe('status', () => {
    it('says what the assistant is doing while it works, and thinks between tools', () => {
      useAssistantStore.setState({
        isAsking: true,
        messages: [
          { kind: 'user', id: 'm-1', text: 'Abre o Checkout' },
          {
            kind: 'tool',
            id: 'c-1',
            call: { name: 'open_workspace', args: { workspace: 'w1' } },
            subject: 'Checkout regression',
            state: 'doing',
          },
        ],
      });

      const { result } = renderHook(() => useAssistantPanelViewModel());

      expect(result.current).toMatchObject({
        status: 'Opening Checkout regression…',
        mood: 'thinking',
        isStill: false,
        isTyping: true,
      });

      act(() => {
        useAssistantStore.getState().endTool({ id: 'c-1', isError: false });
      });

      expect(result.current.status).toBe('thinking…');
      expect(result.current.rows[1]).toMatchObject({
        kind: 'tool',
        icon: 'passed',
        text: 'Opened Checkout regression',
        failed: '',
      });
    });

    it('waits for the QA while a card asks them, with no dots going', () => {
      useAssistantStore.setState({
        isAsking: true,
        messages: [
          {
            kind: 'confirm',
            id: 'c-1',
            action: 'delete_workspace',
            subject: 'Login',
            count: 0,
            decision: null,
          },
        ],
      });

      const { result } = renderHook(() => useAssistantPanelViewModel());

      expect(result.current).toMatchObject({
        status: 'waiting for you to answer the card',
        isTyping: false,
      });

      act(() => {
        useAssistantStore.getState().settleConfirm({ id: 'c-1', decision: 'kept' });
      });

      expect(result.current).toMatchObject({ status: 'thinking…', isTyping: true });
    });

    it('marks a tool that did not work', () => {
      useAssistantStore.setState({
        messages: [
          {
            kind: 'tool',
            id: 'c-1',
            call: { name: 'run_details', args: { workspace: 'w1' } },
            subject: 'Checkout regression',
            state: 'failed',
          },
        ],
      });

      const { result } = renderHook(() => useAssistantPanelViewModel());

      expect(result.current.rows[0]).toMatchObject({
        icon: 'failed',
        text: 'Reading the latest run of Checkout regression',
        failed: "didn't work",
      });
      expect(result.current.status).toBe('');
    });
  });

  describe('suggestions', () => {
    it('offers to read the latest run of the workspace on screen, and asks it when picked', async () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useAssistantPanelViewModel());

      expect(result.current.suggestions.map(({ id }) => id)).toEqual([
        'abilities',
        'lastRun',
        'summary',
        'explore',
      ]);

      act(() => {
        result.current.suggestions[1]?.onClick();
      });

      expect(asked[0]?.text).toBe('What failed in the latest run?');
      await waitFor(() => {
        expect(useAssistantStore.getState().isAsking).toBe(false);
      });
    });
  });

  describe('onInputKeyDown', () => {
    it('sends on Enter, and keeps a new line on Shift+Enter', () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onDraft('Oi');
      });
      act(() => {
        result.current.onInputKeyDown(key({ key: 'Enter', shiftKey: true }));
      });

      expect(asked).toEqual([]);

      act(() => {
        result.current.onInputKeyDown(key({ key: 'Enter' }));
      });

      expect(asked).toHaveLength(1);
    });
  });

  describe('onPanelKeyDown', () => {
    it('closes the chat on Escape, and on nothing else', () => {
      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onPanelKeyDown(key({ key: 'a' }));
      });

      expect(useAssistantStore.getState().isOpen).toBe(true);

      act(() => {
        result.current.onPanelKeyDown(key({ key: 'Escape' }));
      });

      expect(useAssistantStore.getState().isOpen).toBe(false);
    });
  });

  describe('onStartOver', () => {
    it('starts a new conversation once the assistant is done, never while it answers', () => {
      useAssistantStore.setState({
        messages: [{ kind: 'user', id: 'm-1', text: 'Oi' }],
        sessionId: 's-1',
        isAsking: true,
      });

      const { result } = renderHook(() => useAssistantPanelViewModel());

      expect(result.current.canStartOver).toBe(false);

      act(() => {
        useAssistantStore.setState({ isAsking: false });
      });
      act(() => {
        result.current.onStartOver();
      });

      expect(useAssistantStore.getState()).toMatchObject({
        messages: [],
        sessionId: null,
      });
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe('onStop', () => {
    it('asks main to stop the answer', () => {
      bridge();

      const { result } = renderHook(() => useAssistantPanelViewModel());

      act(() => {
        result.current.onStop();
      });

      expect(window.qazinho.stopAssistant).toHaveBeenCalled();
    });
  });
});
