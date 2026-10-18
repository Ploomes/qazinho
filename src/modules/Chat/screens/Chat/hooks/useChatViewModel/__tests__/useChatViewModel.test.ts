// @vitest-environment jsdom
import type { IAskAgent, IChatAnswer, IChatQuestion, IChatTurn } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useChatViewModel } from '@/modules/Chat/screens/Chat/hooks/useChatViewModel';
import { endRun, startRun } from '@/modules/Workspace/library';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
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

const DRAFTED: IChatAnswer = {
  reply: 'Two cases over the checkout.',
  questions: [],
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
};

function answering(turn: Partial<IChatTurn>) {
  const ask = vi.fn((_: IAskAgent): Promise<IChatTurn> =>
    Promise.resolve({
      sessionId: 'session-1',
      text: '',
      usage: null,
      isError: false,
      answer: null,
      failure: null,
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
        isSignedIn: true,
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
    expect(result.current.suggestions.map(({ label, text }) => [label, text])).toEqual([
      ['Create a test plan', "Let's create a test plan."],
      ['Test a feature', 'I want to test a specific feature.'],
    ]);
  });

  /**
   * The suggestion only opens the conversation: a long ask for flows and edge cases read as an
   * order to write the plan at once, and the agent guessed instead of asking.
   */
  it('starts the suggestions with a test plan, and only opens the conversation about it', async () => {
    const ask = answering({ answer: DRAFTED });
    const { result } = renderHook(() => useChatViewModel());
    const [plan] = result.current.suggestions;

    expect(plan?.label).toBe('Create a test plan');

    act(() => {
      result.current.onSuggestion(plan?.text ?? '');
    });

    await waitFor(() => {
      expect(ask).toHaveBeenCalledOnce();
    });
    expect(ask.mock.calls[0]?.[0].text).toBe("Let's create a test plan.");
  });

  describe('the size a run takes', () => {
    it('tells the agent the size the device is set to, so a plan never counts on another', async () => {
      const ask = answering({ answer: DRAFTED });

      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace([]), viewportId: 'phone' }],
      });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Plan the checkout.');
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].viewport).toEqual({ width: 390, height: 844 });
    });

    it('names no size for a phone app, which runs at the size the device is', async () => {
      const ask = answering({ answer: DRAFTED });

      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [{ id: 't1', kind: 'android', label: 'Android', value: '/app.apk' }],
          },
        ],
      });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Plan the checkout.');
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].viewport).toBeNull();
    });
  });

  describe('the answer as it arrives', () => {
    it('shows what the agent is writing while it works', () => {
      answering({});
      useWorkspaceStore.setState({ isAgentTyping: true, liveText: 'Two **cases**.' });

      expect(renderHook(() => useChatViewModel()).result.current.liveText).toBe(
        'Two **cases**.',
      );
    });

    it('puts the final answer where the preview was, without it entering again', () => {
      answering({});

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        useWorkspaceStore.setState({ isAgentTyping: true, liveText: 'Two cases.' });
      });
      act(() => {
        useWorkspaceStore.getState().landAgentText({
          workspaceId: 'w1',
          text: 'Two cases.',
          who: 'Claude Code',
          sessionId: null,
        });
      });

      expect(result.current.liveText).toBe('');
      expect(result.current.messages.at(-1)).toMatchObject({ isNew: false });
    });

    it('lets an answer with no preview enter like any new message', () => {
      answering({});

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        useWorkspaceStore.setState({ isAgentTyping: true, liveText: '' });
      });
      act(() => {
        useWorkspaceStore.getState().landAgentText({
          workspaceId: 'w1',
          text: 'Two cases.',
          who: 'Claude Code',
          sessionId: null,
        });
      });

      expect(result.current.messages.at(-1)).toMatchObject({ isNew: true });
    });
  });

  describe('onSend', () => {
    it("asks the QA's own agent, on the model they picked", async () => {
      const ask = answering({ answer: DRAFTED });
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
      answering({ answer: DRAFTED });
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
      const ask = answering({
        answer: { reply: '1 + 1 is 2.', questions: [], plan: null },
      });
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
      const ask = answering({
        answer: { reply: 'It checks out.', questions: [], plan: null },
      });
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

    /** A plan the chat wrote mid-run replaced the one main was walking: the run's report came back under the wrong cases. */
    it('does NOT change the plan while a run walks it, and says so', async () => {
      answering({ answer: DRAFTED });
      useWorkspaceStore.setState({
        workspaces: [
          startRun({ workspace: makeWorkspace(), startedAt: '09:41', runId: 'r-01' }),
        ],
      });

      const before = useWorkspaceStore.getState().workspaces[0]?.plan;
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Add a case for the coupon.');
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'error',
          text: expect.stringContaining('a run is walking it') as string,
        });
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.plan).toBe(before);
    });

    it('says so when the answer is not in a shape it can read', async () => {
      answering({ text: JSON.stringify({ verdict: 'passed' }), answer: null });
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

    /** A signed-out Codex used to tell the QA to run codex login in a terminal, in English. */
    it('tells the QA where to sign a signed-out agent in, in their language', async () => {
      await i18n.changeLanguage('pt');
      answering({ isError: true, failure: { reason: 'agent-signed-out' } });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Testa');
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'error',
          text: 'O Claude Code está deslogado. Faça login nele em Configurações → Agentes e pergunte de novo.',
        });
      });
      await i18n.changeLanguage('en');
    });

    it('says it in the language the QA reads', async () => {
      await i18n.changeLanguage('pt');
      answering({ text: JSON.stringify({ verdict: 'passed' }), answer: null });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Testa');
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'error',
          text: expect.stringContaining('O agente respondeu') as string,
        });
      });
      await i18n.changeLanguage('en');
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

  describe('a round of questions', () => {
    const SCOPE: IChatQuestion = {
      header: 'Scope',
      question: 'What should the plan cover?',
      options: [
        { label: 'The checkout', description: 'From the cart to the receipt.' },
        { label: 'The whole shop', description: 'Every flow a buyer takes.' },
      ],
      isMultiSelect: false,
    };

    async function asked(reply: string) {
      const ask = answering({ answer: { reply, questions: [SCOPE], plan: null } });
      const view = renderHook(() => useChatViewModel());

      act(() => {
        view.result.current.onDraftChange('Write a test plan');
      });
      act(() => {
        view.result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'questions',
        });
      });

      return { ask, view };
    }

    it("puts the agent's questions under its reply, waiting for the QA", async () => {
      const { view } = await asked('Two things first.');
      const chat = useWorkspaceStore.getState().workspaces[0]?.chat ?? [];

      expect(chat.map(({ kind }) => kind)).toEqual(['user', 'agent', 'questions']);
      expect(view.result.current.messages.at(-1)).toMatchObject({ isAnswerable: true });
      expect(view.result.current.messages[1]).toMatchObject({ isAnswerable: false });
    });

    it('lands a round that came with no reply', async () => {
      await asked('');

      const chat = useWorkspaceStore.getState().workspaces[0]?.chat ?? [];

      expect(chat.map(({ kind }) => kind)).toEqual(['user', 'questions']);
    });

    it('sends the answers to the agent, and keeps them on the round', async () => {
      const { ask, view } = await asked('Two things first.');
      const round = useWorkspaceStore.getState().workspaces[0]?.chat.at(-1);
      const answers = [{ picked: ['The checkout'], text: 'with a coupon' }];

      act(() => {
        view.result.current.onAnswerQuestions({ messageId: round?.id ?? '', answers });
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledTimes(2);
      });
      expect(ask.mock.calls[1]?.[0].text).toBe(
        'Scope (What should the plan cover?): The checkout — with a coupon',
      );
      expect(useWorkspaceStore.getState().workspaces[0]?.chat[2]).toMatchObject({
        kind: 'questions',
        answers,
      });
    });

    it('does NOT take answers while the agent is still working', async () => {
      const { ask, view } = await asked('Two things first.');
      const round = useWorkspaceStore.getState().workspaces[0]?.chat.at(-1);

      act(() => {
        useWorkspaceStore.setState({ isAgentTyping: true });
      });
      act(() => {
        view.result.current.onAnswerQuestions({
          messageId: round?.id ?? '',
          answers: [{ picked: ['The checkout'], text: '' }],
        });
      });

      expect(ask).toHaveBeenCalledOnce();
      expect(view.result.current.messages.at(-1)).toMatchObject({ isAnswerable: false });
    });

    it('stops offering a round once the QA wrote something else instead', async () => {
      const { view } = await asked('Two things first.');

      act(() => {
        view.result.current.onDraftChange('Actually, just the login');
      });
      act(() => {
        view.result.current.onSend();
      });

      const round = view.result.current.messages.find(
        ({ message }) => message.kind === 'questions',
      );

      expect(round).toMatchObject({ isAnswerable: false });
    });
  });

  describe('a run card', () => {
    it('says how the run ended when it did not walk the whole plan', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [
          endRun({
            workspace: walkRun({ verdicts: ['passed', 'failed'] }),
            at: '09:43',
            endedBy: 'stopped',
          }),
        ],
      });

      const card = renderHook(() => useChatViewModel()).result.current.messages.find(
        ({ message }) => message.kind === 'run',
      );

      expect(card?.runTitle).toBe('Run r-01 · stopped · 1 passed · 1 failed');
    });

    it('keeps the plain title for a run that walked it all', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      });

      const card = renderHook(() => useChatViewModel()).result.current.messages.find(
        ({ message }) => message.kind === 'run',
      );

      expect(card?.runTitle).toBe('Run r-01 · 1 passed · 0 failed');
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
      expect(result.current.mentionQuery).toBeNull();
    });

    it('knows the workspace has something to point at, so an empty list means no match', () => {
      answering({});
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('explain @zzz');
      });

      expect(result.current.mentions).toEqual([]);
      expect(result.current.mentionQuery).toBe('zzz');
      expect(result.current.hasReferences).toBe(true);
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
