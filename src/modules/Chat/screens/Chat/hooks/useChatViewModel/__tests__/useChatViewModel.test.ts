// @vitest-environment jsdom
import type { IAskAgent, IChatAnswer, IChatQuestion, IChatTurn } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useChatViewModel } from '@/modules/Chat/screens/Chat/hooks/useChatViewModel';
import { endRun, landAsked, startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useAssistantStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
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
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace([])],
    askingIds: [],
    liveTexts: {},
    readSteps: {},
  });
  useSetupStore.setState({ integrations: [] });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useChatViewModel', () => {
  describe('a command that is missing something', () => {
    const picking = (id: string) => {
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('/');
      });
      act(() => {
        result.current.onPickCommand(id);
      });

      return result;
    };

    beforeEach(() => {
      useAppStore.setState({ screen: 'workspace', modal: null, editingProjectId: null });
      useSettingsStore.setState({ tab: 'agent' });
      useAssistantStore.setState({ tip: null, isOpen: false });
    });

    /** O chat do Estagiário aberto cobriria o botão que ele acabou de mandar apertar. */
    it('shuts the chat of the Intern, which would cover what he points at', () => {
      useAssistantStore.setState({ isOpen: true });

      picking('jira-plan');

      expect(useAssistantStore.getState().isOpen).toBe(false);
    });

    it('takes the QA to the integrations, and the Intern says what to do there', () => {
      const result = picking('jira-plan');

      expect(useAppStore.getState().screen).toBe('settings');
      expect(useSettingsStore.getState().tab).toBe('connections');
      expect(useAssistantStore.getState().tip?.text).toBe(
        'Connect Jira here, then come back to /jira.',
      );
      expect(result.current.command).toBeNull();
      expect(result.current.draft).toBe('');
    });

    it('opens the code of the project when GitHub is there but no repository is', () => {
      useSetupStore.setState({
        integrations: [
          { id: 'github', account: 'qa', site: null, connectedAt: '2026-10-20' },
        ],
      });

      picking('code-plan');

      expect(useAppStore.getState()).toMatchObject({
        screen: 'workspace',
        modal: 'project',
        editingProjectId: PROJECT.id,
        projectSection: 'code',
      });
      expect(useAssistantStore.getState().tip?.text).toBe(
        'Add the repositories here, then come back to /code.',
      );
    });

    it('does NOT take the QA anywhere for a command that needs nothing', () => {
      picking('figma-plan');

      expect(useAppStore.getState()).toMatchObject({ screen: 'workspace', modal: null });
      expect(useAssistantStore.getState().tip).toBeNull();
    });
  });

  it('opens empty, with the suggestions the QA can start from', () => {
    answering({});

    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.suggestions.map(({ label, text }) => [label, text])).toEqual([
      ['Create a test plan', "Let's create a test plan."],
      ['Test a feature', 'I want to test a specific feature.'],
      ['Write the cases myself', ''],
      ['Explore the app for 10 min', ''],
      ['Check against a Figma design', ''],
      ['Import tests I already have', ''],
    ]);
  });

  it('starts an exploration from its suggestion, with no plan and no message to the agent', () => {
    const ask = answering({});
    const start = vi.fn();

    window.qazinho = { ...window.qazinho, startRun: start };

    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.suggestions
        .find(({ id }) => id === 'CHAT.SUGGESTION_EXPLORE')
        ?.onClick();
    });

    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'explore', minutes: 10, steps: [] }),
    );
    expect(ask).not.toHaveBeenCalled();
    expect(useWorkspaceStore.getState().workspaces[0]?.live?.kind).toBe('explore');
  });

  /**
   * A sugestão só abre a conversa: um pedido longo por fluxos e casos de borda soava como
   * uma ordem para escrever o plano na hora, e o agente adivinhava em vez de perguntar.
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
            repositories: [],
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

  describe('an agent that cannot reach its service', () => {
    it('says it is trying again, and which try it is on', () => {
      answering({});
      useWorkspaceStore.setState({
        askingIds: ['w1'],
        retries: { w1: { attempt: 3, maxRetries: 10 } },
      });

      expect(renderHook(() => useChatViewModel()).result.current.retryText).toBe(
        'The agent cannot reach its service, so it is trying again (3 of 10).',
      );
    });

    it('stops saying so once the answer starts coming in', () => {
      answering({});
      useWorkspaceStore.setState({
        askingIds: ['w1'],
        retries: { w1: { attempt: 3, maxRetries: 10 } },
      });
      useWorkspaceStore.getState().setLiveText({ workspaceId: 'w1', text: 'Two cases.' });

      expect(renderHook(() => useChatViewModel()).result.current.retryText).toBe('');
    });

    it('does NOT show the retry of another workspace', () => {
      answering({});
      useWorkspaceStore.setState({
        askingIds: ['w1'],
        retries: { w2: { attempt: 2, maxRetries: 10 } },
      });

      expect(renderHook(() => useChatViewModel()).result.current.retryText).toBe('');
    });
  });

  describe('the answer as it arrives', () => {
    it('shows what the agent is writing while it works', () => {
      answering({});
      useWorkspaceStore.setState({
        askingIds: ['w1'],
        liveTexts: { w1: 'Two **cases**.' },
      });

      expect(renderHook(() => useChatViewModel()).result.current.liveText).toBe(
        'Two **cases**.',
      );
    });

    it('puts the final answer where the preview was, without it entering again', () => {
      answering({});

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        useWorkspaceStore.setState({
          askingIds: ['w1'],
          liveTexts: { w1: 'Two cases.' },
        });
      });
      act(() => {
        useWorkspaceStore.getState().landAgentText({
          workspaceId: 'w1',
          text: 'Two cases.',
          who: 'Claude Code',
          agentId: 'claude-code',
          sessionId: null,
        });
      });

      expect(result.current.liveText).toBe('');
      expect(result.current.items.at(-1)).toMatchObject({ isNew: false });
    });

    it('lets an answer with no preview enter like any new message', () => {
      answering({});

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        useWorkspaceStore.setState({ askingIds: ['w1'], liveTexts: { w1: '' } });
      });
      act(() => {
        useWorkspaceStore.getState().landAgentText({
          workspaceId: 'w1',
          text: 'Two cases.',
          who: 'Claude Code',
          agentId: 'claude-code',
          sessionId: null,
        });
      });

      expect(result.current.items.at(-1)).toMatchObject({ isNew: true });
    });
  });

  describe('isComposerFocused', () => {
    it('puts the cursor in the composer of a chat with nothing in it yet', () => {
      expect(renderHook(() => useChatViewModel()).result.current.isComposerFocused).toBe(
        true,
      );
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

    /**
     * Um token colado no chat chegaria ao agente; o chat do Estagiário já segurava um
     * antes.
     */
    it('holds back a message with a token until the QA takes it out or insists', async () => {
      const ask = answering({ answer: DRAFTED });
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Use ghp_a1b2c3d4e5f6g7h8i9j0k1l2 to read the repo');
      });
      act(() => {
        result.current.onSend();
      });

      expect(ask).not.toHaveBeenCalled();
      expect(result.current.secretWarning).toBe(
        "This looks like a password or a token (ghp_a1…). The agent would read it: keep it as one of the project's variables instead.",
      );

      act(() => {
        result.current.onRemoveSecret();
      });

      expect(result.current.draft).toBe('Use to read the repo');
      expect(result.current.secretWarning).toBe('');

      act(() => {
        result.current.onDraftChange(
          'ghp_a1b2c3d4e5f6g7h8i9j0k1l2 is fake, test the 401',
        );
      });
      act(() => {
        result.current.onSendSecret();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].text).toBe(
        'ghp_a1b2c3d4e5f6g7h8i9j0k1l2 is fake, test the 401',
      );
    });

    it('does NOT send a second message while the agent still answers the first', () => {
      const ask = answering({});

      useWorkspaceStore.setState({ askingIds: ['w1'] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('And another thing');
      });
      act(() => {
        result.current.onSend();
      });

      expect(ask).not.toHaveBeenCalled();
      expect(useWorkspaceStore.getState().workspaces[0]?.chat).toHaveLength(0);
    });

    it('shows the agent at work only in the workspace it answers in', () => {
      answering({});
      useWorkspaceStore.setState({ askingIds: ['w2'], liveTexts: { w2: 'Elsewhere.' } });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.isAgentTyping).toBe(false);
      expect(result.current.liveText).toBe('');
    });

    it('stops the agent of this workspace when the QA asks', () => {
      answering({});

      const stop = vi.fn(() => Promise.resolve());

      window.qazinho = { ...window.qazinho, stopAgent: stop };
      useWorkspaceStore.setState({ askingIds: ['w1'] });
      renderHook(() => useChatViewModel()).result.current.onStop();

      expect(stop).toHaveBeenCalledWith('w1');
    });

    it('lands no error for an answer the QA stopped, and frees the chat', async () => {
      answering({ isError: true, failure: { reason: 'stopped' } });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Plan the checkout');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().askingIds).toEqual([]);
      });
      expect(
        useWorkspaceStore.getState().workspaces[0]?.chat.map(({ kind }) => kind),
      ).toEqual(['user']);
    });

    it('starts a session of its own when the workspace talked to another agent before', async () => {
      const ask = answering({ answer: { reply: 'Hi.', questions: [], plan: null } });

      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace([]), sessionId: 's-codex', sessionAgentId: 'codex' },
        ],
      });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Hello');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].sessionId).toBeNull();
      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]).toMatchObject({
          sessionId: 'session-1',
          sessionAgentId: 'claude-code',
        });
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
      expect(useWorkspaceStore.getState().askingIds).toEqual([]);
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

    /**
     * Um plano que o chat escreveu no meio de uma run substituía o que a main estava
     * andando: o relatório da run voltava sob os casos errados.
     */
    it('does NOT change the plan when a run began while the agent was writing it, and says so', async () => {
      answering({ answer: DRAFTED });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const before = useWorkspaceStore.getState().workspaces[0]?.plan;
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Add a case for the coupon.');
        useWorkspaceStore.setState({
          workspaces: useWorkspaceStore
            .getState()
            .workspaces.map((workspace) =>
              startRun({ workspace, startedAt: '09:41', runId: 'r-01', by: WALKED_BY }),
            ),
        });
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

    /** Um Codex deslogado mandava o QA rodar codex login num terminal, em inglês. */
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
          text: 'O Claude Code está deslogado. Faça login nele em Configurações → Agente e pergunte de novo.',
        });
      });
      await i18n.changeLanguage('en');
    });

    it("says why GitHub would not hand over the code, in the QA's words", async () => {
      answering({
        isError: true,
        failure: {
          reason: 'code',
          failure: 'not-found',
          said: 'gh: Not Found (HTTP 404)',
        },
      });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Plan it');
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
          kind: 'error',
          text: 'QAzinho could not get the code from GitHub. GitHub did not find it, or this account cannot see it.',
        });
      });
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
      expect(view.result.current.items.at(-1)).toMatchObject({ isAnswerable: true });
      expect(view.result.current.items[1]).toMatchObject({ isAnswerable: false });
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

    /**
     * O QA não sabe e o agente também não: a pergunta vira a próxima dúvida do plano, que a
     * história recebe num comentário, e o agente planeja sabendo dela.
     */
    it('turns a question sent to the story into the next doubt, which the agent hears', async () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([]),
            issue: {
              key: 'SHOP-878',
              title: 'Coupons at checkout',
              source: 'jira',
              url: 'https://shop.atlassian.net/browse/SHOP-878',
            },
            doubts: [
              { id: 'D1', question: 'Does a coupon stack?', sent: null, answer: null },
            ],
          },
        ],
      });

      const { ask, view } = await asked('Two things first.');
      const round = useWorkspaceStore.getState().workspaces[0]?.chat.at(-1);

      expect(view.result.current.canAskStory).toBe(true);

      act(() => {
        view.result.current.onAnswerQuestions({
          messageId: round?.id ?? '',
          answers: [{ picked: [], text: '', toStory: true }],
        });
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledTimes(2);
      });
      expect(ask.mock.calls[1]?.[0].text).toBe(
        'Scope (What should the plan cover?): sent to the story as D2, since no one here knows yet',
      );
      expect(ask.mock.calls[1]?.[0].doubts?.map(({ id }) => id)).toEqual(['D1', 'D2']);
      expect(useWorkspaceStore.getState().workspaces[0]?.doubts?.at(-1)).toEqual({
        id: 'D2',
        question: 'What should the plan cover?',
        sent: null,
        answer: null,
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.chat[2]).toMatchObject({
        answers: [{ toStory: true, doubtId: 'D2' }],
      });
    });

    /**
     * O projeto diz em quais status uma história chegou para teste. Um plano escrito de uma
     * história ainda fora deles espera o app, e o botão de rodar diz isso.
     */
    it('tells the agent the statuses that mean ready, and keeps a plan ahead of the app', async () => {
      useAppStore.setState({
        projects: [{ ...PROJECT, readyStatuses: ['Ready for QA'] }],
      });

      const ask = answering({ answer: DRAFTED, readiness: 'ahead' });
      const view = renderHook(() => useChatViewModel());

      act(() => {
        view.result.current.onDraftChange('Plan SHOP-878');
      });
      act(() => {
        view.result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.storyStage).toBe('ahead');
      });
      expect(ask.mock.calls[0]?.[0].readyStatuses).toEqual(['Ready for QA']);
    });

    /** É contra esse retrato que "Conferir mudanças" acha, sem IA, o que mudou depois. */
    it('keeps how the story read when the plan was written from it', async () => {
      const snapshot = {
        kind: 'story' as const,
        key: 'SHOP-878',
        url: 'https://shop.atlassian.net/browse/SHOP-878',
        text: 'C3. Bloquear depois de 3 tentativas',
        at: '2026-11-13T13:00:00.000Z',
      };

      answering({ answer: DRAFTED, snapshots: [snapshot] });

      const view = renderHook(() => useChatViewModel());

      act(() => {
        view.result.current.onDraftChange('Plan SHOP-878');
      });
      act(() => {
        view.result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.snapshots).toEqual([snapshot]);
      });
    });

    it('lets go of the wait once a turn reads the story arrived for testing', async () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace([]), storyStage: 'ahead' }],
      });
      answering({ answer: DRAFTED, readiness: 'ready' });

      const view = renderHook(() => useChatViewModel());

      act(() => {
        view.result.current.onDraftChange('Plan SHOP-878 again');
      });
      act(() => {
        view.result.current.onSend();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.plan.length).toBeGreaterThan(
          0,
        );
      });
      expect(useWorkspaceStore.getState().workspaces[0]).not.toHaveProperty('storyStage');
    });

    it('does NOT offer the story to a workspace with no Jira story', async () => {
      const { view } = await asked('Two things first.');

      expect(view.result.current.canAskStory).toBe(false);
    });

    it('does NOT take answers while the agent is still working', async () => {
      const { ask, view } = await asked('Two things first.');
      const round = useWorkspaceStore.getState().workspaces[0]?.chat.at(-1);

      act(() => {
        useWorkspaceStore.setState({ askingIds: ['w1'] });
      });
      act(() => {
        view.result.current.onAnswerQuestions({
          messageId: round?.id ?? '',
          answers: [{ picked: ['The checkout'], text: '' }],
        });
      });

      expect(ask).toHaveBeenCalledOnce();
      expect(view.result.current.items.at(-1)).toMatchObject({ isAnswerable: false });
    });

    it('stops offering a round once the QA wrote something else instead', async () => {
      const { view } = await asked('Two things first.');

      act(() => {
        view.result.current.onDraftChange('Actually, just the login');
      });
      act(() => {
        view.result.current.onSend();
      });

      const round = view.result.current.items.find(
        (item) => item.kind === 'message' && item.message.kind === 'questions',
      );

      expect(round).toMatchObject({ isAnswerable: false });
    });
  });

  describe('a talk with the coding agent of the QA', () => {
    type Talk = ReturnType<typeof useChatViewModel>['items'][number] & { kind: 'talk' };

    const talksOf = (view: { items: { kind: string }[] }) =>
      view.items.filter((item) => item.kind === 'talk') as Talk[];

    const chatWith = () =>
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([]),
            chat: [
              {
                id: 'm-1',
                kind: 'user',
                at: '10:00',
                text: 'Plan the cart',
                from: 'agent',
                caller: 'claude-code',
                readAt: '10:02',
              },
              {
                id: 'm-2',
                kind: 'agent',
                at: '10:01',
                who: 'Estagiário',
                text: 'Planned.',
              },
              { id: 'm-3', kind: 'user', at: '10:05', text: 'Nice' },
              {
                id: 'm-4',
                kind: 'user',
                at: '10:06',
                text: 'Plan the coupon',
                from: 'agent',
              },
              {
                id: 'm-5',
                kind: 'agent',
                at: '10:07',
                who: 'Estagiário',
                text: 'Planned too.',
              },
            ],
          },
        ],
      });

    it('names who the QA’s agent talked with, how much and when it read the answer', async () => {
      await i18n.changeLanguage('pt');
      chatWith();

      const [first, last] = talksOf(renderHook(() => useChatViewModel()).result.current);

      expect(first).toMatchObject({
        title: 'Conversa com o Claude Code',
        facts: '1 mensagem dele · 10:00',
        receipt: 'O Claude Code leu a resposta às 10:02',
      });
      expect(first?.rows.map((row) => [row.key, row.isFollowUp, row.who])).toEqual([
        ['m-1', false, 'QAzinho'],
        ['m-2', false, 'QAzinho'],
      ]);
      expect(last).toMatchObject({
        title: 'Conversa com o seu agente de código',
        receipt: null,
      });

      await i18n.changeLanguage('en');
    });

    it('names QAzinho again after each message of the coding agent, as in a dialogue', () => {
      chatWith();

      const [, last] = talksOf(renderHook(() => useChatViewModel()).result.current);

      expect(last?.rows.map((row) => row.isFollowUp)).toEqual([false, false]);
    });

    it('opens only the last talk, and lets the QA open or fold any', () => {
      chatWith();

      const view = renderHook(() => useChatViewModel());

      expect(talksOf(view.result.current).map((talk) => talk.isExpanded)).toEqual([
        false,
        true,
      ]);

      act(() => {
        view.result.current.onToggleTalk('m-1');
        view.result.current.onToggleTalk('m-4');
      });

      expect(talksOf(view.result.current).map((talk) => talk.isExpanded)).toEqual([
        true,
        false,
      ]);
    });

    it('keeps what the QA wrote outside the talk', () => {
      chatWith();

      const { items } = renderHook(() => useChatViewModel()).result.current;

      expect(items.map((item) => item.kind)).toEqual(['talk', 'message', 'talk']);
    });
  });

  describe('a run in the chat', () => {
    const sectionOf = (view: { items: { kind: string }[] }) =>
      view.items.find((item) => item.kind === 'run') as
        | (ReturnType<typeof useChatViewModel>['items'][number] & { kind: 'run' })
        | undefined;

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

      expect(
        sectionOf(renderHook(() => useChatViewModel()).result.current)?.title,
      ).toMatch(/^Run .+, stopped: 1 failed$/);
    });

    it('says the day a run started with its time, and only the time when no step kept it', () => {
      answering({});

      const walked = walkRun({
        verdicts: ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'],
        isFinished: true,
      });
      const at = (span: { from: number; to: number } | null) => ({
        ...walked,
        runs: walked.runs.map((run) => ({
          ...run,
          cases: run.cases.map((runCase) => ({
            ...runCase,
            steps: runCase.steps.map((step) => ({ ...step, span })),
          })),
        })),
      });

      useWorkspaceStore.setState({
        workspaces: [at({ from: Date.now(), to: Date.now() + 1_000 })],
      });

      expect(
        sectionOf(renderHook(() => useChatViewModel()).result.current)?.title,
      ).toMatch(/^Run today at /);

      useWorkspaceStore.setState({ workspaces: [at(null)] });

      expect(
        sectionOf(renderHook(() => useChatViewModel()).result.current)?.title,
      ).toMatch(/^Run at /);
    });

    it('keeps the plain title for a run that walked it all', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [
          walkRun({
            verdicts: ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'],
            isFinished: true,
          }),
        ],
      });

      /* O título contava passos e a aba Runs contava casos: agora os dois contam casos. */
      expect(
        sectionOf(renderHook(() => useChatViewModel()).result.current)?.title,
      ).toMatch(/: 2 passed$/);
    });

    it('counts one case in the singular, in Portuguese too', async () => {
      answering({});
      const walked = walkRun({
        verdicts: ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'],
        isFinished: true,
      });

      useWorkspaceStore.setState({
        workspaces: [
          {
            ...walked,
            runs: walked.runs.map((run) => ({ ...run, cases: run.cases.slice(0, 1) })),
          },
        ],
      });
      await i18n.changeLanguage('pt');

      const title = sectionOf(renderHook(() => useChatViewModel()).result.current)?.title;

      await i18n.changeLanguage('en');
      expect(title).toMatch(/: 1 passou$/);
    });

    it('shows the face of the agent once over replies it says in a row', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([]),
            chat: [
              { id: 'm-1', kind: 'user', at: '09:40', text: 'Plan it' },
              {
                id: 'm-2',
                kind: 'agent',
                at: '09:41',
                who: 'Claude Code',
                text: 'Sure.',
              },
              {
                id: 'm-3',
                kind: 'agent',
                at: '09:41',
                who: 'Claude Code',
                text: 'Done.',
              },
              { id: 'm-4', kind: 'agent', at: '09:42', who: 'Codex', text: 'Here.' },
            ],
          },
        ],
      });

      const items = renderHook(() => useChatViewModel()).result.current.items;

      expect(
        items.map((item) => (item.kind === 'message' ? item.isFollowUp : null)),
      ).toEqual([false, false, true, false]);
    });

    it('leaves loose the error of a run that broke before its first step', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([]),
            chat: [
              {
                id: 'm-1',
                kind: 'error',
                runId: 'r-01',
                at: '09:41',
                text: 'Chrome could not open http://127.0.0.1:4999/.',
                detail: null,
                fix: null,
              },
            ],
          },
        ],
      });

      expect(
        renderHook(() => useChatViewModel()).result.current.items.map(({ kind }) => kind),
      ).toEqual(['message']);
    });

    it('keeps what a run said in one folded section, with the step it is on while it goes', () => {
      answering({});

      const walked = walkRun({ verdicts: ['passed', 'failed'] });

      useWorkspaceStore.setState({ workspaces: [walked] });
      act(() => {
        useWorkspaceStore.getState().landNote({
          workspaceId: 'w1',
          text: 'I closed a banner first.',
          who: 'Claude Code',
        });
      });

      const view = renderHook(() => useChatViewModel()).result.current;
      const section = sectionOf(view);

      expect(view.items.map(({ kind }) => kind)).toEqual(['run']);
      expect(section).toMatchObject({
        title: 'Run r-01: running step 3 of 6',
        isLive: true,
        isExpanded: false,
        isExpandable: true,
        openLabel: null,
      });
      expect(section?.rows.map(({ message }) => message.kind)).toEqual([
        'verdict',
        'note',
      ]);
    });

    it('opens a section and folds it again', () => {
      answering({});
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['failed'] })] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onToggleRun('r-01');
      });

      expect(sectionOf(result.current)?.isExpanded).toBe(true);

      act(() => {
        result.current.onToggleRun('r-01');
      });

      expect(sectionOf(result.current)?.isExpanded).toBe(false);
    });

    it('opens the report of the very run it was clicked on', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['failed'], isFinished: true })],
        selectedRunId: null,
      });

      const { result } = renderHook(() => useChatViewModel());

      expect(sectionOf(result.current)?.openLabel).toBe('Open in Runs');

      act(() => {
        result.current.onOpenRun('r-01');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        selectedRunId: 'r-01',
        panelTab: 'runs',
      });
    });
  });

  describe('what the agent knows of the runs', () => {
    it('tells the agent how the latest run went with every message, though it never walked it', async () => {
      const ask = answering({});

      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed', 'failed'], isFinished: true })],
      });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('Why did the checkout fail?');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].runs).toMatchObject([
        { kind: 'run', id: 'r-01', title: 'The whole plan, 09:41' },
      ]);
    });
  });

  describe('onOpenBug', () => {
    it('opens the bug a run filed on the side of a step, in Bugs', () => {
      answering({});
      useWorkspaceStore.setState({ openBugId: null });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onOpenBug('BUG-09');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        openBugId: 'BUG-09',
        panelTab: 'bugs',
      });
    });

    it('does NOT fold the bug when it was already open', () => {
      answering({});
      useWorkspaceStore.setState({ openBugId: 'BUG-09' });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onOpenBug('BUG-09');
      });

      expect(useWorkspaceStore.getState().openBugId).toBe('BUG-09');
    });
  });

  describe('a chat while a run goes', () => {
    it('hands what the QA says to the run, and asks no new chat turn', () => {
      const ask = answering({});
      const talk = vi.fn().mockResolvedValue(undefined);

      window.qazinho = { ...window.qazinho, talkRun: talk };
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.lockedText).toBeNull();
      expect(result.current.composerHint).toBe(
        'Saw something? Say it and the agent checks',
      );

      act(() => {
        result.current.onDraftChange('The header flickered');
      });
      act(() => {
        result.current.onSend();
      });

      expect(ask).not.toHaveBeenCalled();
      expect(talk).toHaveBeenCalledWith({
        workspaceId: expect.any(String),
        text: 'The header flickered',
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
        kind: 'user',
        text: 'The header flickered',
      });
      expect(result.current.talkStatus).toBe(
        'The agent will hear you as soon as it finishes what it is doing',
      );
      expect(result.current.draft).toBe('');
    });

    it('offers no command, mention or attachment while talking to a run', () => {
      answering({});
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onDraftChange('/fig');
      });

      expect(result.current).toMatchObject({
        commandPicker: null,
        command: null,
        mentions: [],
        mentionQuery: null,
        canAttachFiles: false,
      });
    });

    it('takes to the chat what the run ended without hearing', () => {
      const ask = answering({});

      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      });

      const workspaceId = useWorkspaceStore.getState().workspaces[0]?.id ?? '';

      renderHook(() => useChatViewModel());

      act(() => {
        useWorkspaceStore
          .getState()
          .landUnheardTalks({ workspaceId, texts: ['The header flickered'] });
      });

      expect(ask).toHaveBeenCalledOnce();
      expect(ask.mock.calls[0]?.[0]).toMatchObject({ text: 'The header flickered' });
      expect(useWorkspaceStore.getState().unheardTalks[workspaceId]).toBeUndefined();
    });

    it('lets the QA talk again once the run is over', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      });

      expect(renderHook(() => useChatViewModel()).result.current.lockedText).toBeNull();
    });
  });

  describe('a question from the run', () => {
    const asking = () =>
      landAsked({ workspace: walkRun({ verdicts: ['passed'] }), question: QUESTION });

    it('shows the question the agent waits on, and points the composer at it', () => {
      answering({});
      useWorkspaceStore.setState({ workspaces: [asking()] });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.question).toEqual({
        key: 'r-01/q-1',
        live: { ...QUESTION, waitedSec: 0 },
      });
      expect(result.current.lockedText).toBe('');
      expect(
        result.current.items.find((item) => item.kind === 'run') as { title?: string },
      ).toMatchObject({ title: 'Run r-01 waiting on you at step 2 of 6' });
    });

    it("hands the QA's answer to main, for the question it waits on", () => {
      answering({});

      const answerRun = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), answerRun };
      useWorkspaceStore.setState({ workspaces: [asking()] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onAnswerQuestion({ kind: 'said', text: 'Premium+' });
      });

      expect(answerRun).toHaveBeenCalledWith({
        workspaceId: 'w1',
        questionId: 'q-1',
        reply: { kind: 'said', text: 'Premium+' },
      });
    });

    /**
     * Uma primeira run num workspace novo andava por trás das boas-vindas do chat vazio,
     * com a pergunta dela invisível.
     */
    it('shows the run and its question in a chat that has said nothing yet', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [
          landAsked({
            workspace: startRun({
              workspace: makeWorkspace(),
              startedAt: '09:41',
              runId: 'r-01',
              by: WALKED_BY,
            }),
            question: QUESTION,
          }),
        ],
      });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.items.map(({ kind }) => kind)).toEqual(['run']);
      expect(result.current.question?.key).toBe('r-01/q-1');
    });

    it('does NOT show a question once its run is over', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [endRun({ workspace: asking(), at: '09:43', endedBy: 'stopped' })],
      });

      expect(renderHook(() => useChatViewModel()).result.current.question).toBeNull();
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

  describe('tests imported while the project was made', () => {
    const SOURCE = {
      name: 'loja-e2e',
      dir: '/Users/qa/loja-e2e',
      frameworks: [{ id: 'playwright', files: 2 }],
      files: ['a.spec.ts'],
      branch: null,
      commit: null,
    };

    it('opens the import on the folder picked, once, in the chat of that workspace', () => {
      useAppStore.setState({
        pendingImport: {
          workspaceId: useAppStore.getState().selectedWorkspaceId ?? '',
          source: SOURCE,
        },
      });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.command).toMatchObject({
        name: 'Import tests',
        isReady: true,
      });
      expect(useAppStore.getState().pendingImport).toBeNull();
    });

    it('waits for the workspace it was asked for', () => {
      useAppStore.setState({ pendingImport: { workspaceId: 'another', source: SOURCE } });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.command).toBeNull();
      expect(useAppStore.getState().pendingImport).not.toBeNull();
    });

    it('opens the story picker a new plan asked for, once', () => {
      useAppStore.setState({
        pendingCommand: {
          workspaceId: useAppStore.getState().selectedWorkspaceId ?? '',
          command: 'jira-plan',
        },
      });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.command).toMatchObject({ name: 'Plan from a Jira story' });
      expect(useAppStore.getState().pendingCommand).toBeNull();
    });
  });

  describe('a plan against a Figma design', () => {
    it('keeps the design on the workspace before the agent hears of it, and the command on the message', async () => {
      const ask = answering({ answer: DRAFTED });
      const link = 'https://www.figma.com/design/AbC123/Shop?node-id=12-345';
      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.suggestions
          .find(({ label }) => label === 'Check against a Figma design')
          ?.onClick();
      });
      act(() => {
        result.current.onDraftChange(link);
      });
      act(() => {
        result.current.onPickCommand(link);
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0]).toMatchObject({
        text: 'Plan the tests against the Figma design Shop.',
        design: { fileKey: 'AbC123', nodeId: '12:345', name: 'Shop', url: link },
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.design).toMatchObject({
        fileKey: 'AbC123',
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.chat[0]).toMatchObject({
        kind: 'user',
        command: { id: 'figma-plan', name: 'Shop', nodeId: '12:345', url: link },
      });
    });
  });

  describe('a plan from a Jira story', () => {
    const STORY = {
      key: 'SHOP-12',
      summary: 'Aplicar cupom',
      url: 'https://acme.atlassian.net/browse/SHOP-12',
    };

    beforeEach(() => {
      useSetupStore.setState({
        integrations: [
          {
            id: 'jira',
            account: 'Ana QA',
            site: 'https://acme.atlassian.net',
            connectedAt: '2026-10-20',
          },
        ],
      });
    });

    it('offers to plan from a story once Jira is in, and not before', () => {
      answering({});

      expect(
        renderHook(() => useChatViewModel()).result.current.suggestions.map(
          ({ label }) => label,
        ),
      ).toContain('Plan from a Jira story');

      useSetupStore.setState({ integrations: [] });

      expect(
        renderHook(() => useChatViewModel()).result.current.suggestions.map(
          ({ label }) => label,
        ),
      ).not.toContain('Plan from a Jira story');
    });

    it('sends the story picked with the command, and keeps the command on the message', async () => {
      const ask = answering({ answer: DRAFTED });

      window.qazinho.searchJira = vi
        .fn()
        .mockResolvedValue({ isListed: true, issues: [STORY] });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.suggestions
          .find(({ label }) => label === 'Plan from a Jira story')
          ?.onClick();
      });

      await waitFor(() => {
        expect(result.current.commandPicker?.rows.map(({ id }) => id)).toEqual([
          'SHOP-12',
        ]);
      });

      act(() => {
        result.current.onPickCommand('SHOP-12');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0]).toMatchObject({
        text: 'Plan the tests for the Jira story SHOP-12: Aplicar cupom.',
        code: null,
        jira: { key: 'SHOP-12' },
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.chat[0]).toMatchObject({
        kind: 'user',
        text: '',
        command: { id: 'jira-plan', ...STORY },
      });
    });

    it('says how reading the story goes while the agent waits for it', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([]),
            chat: [
              {
                id: 'm-1',
                kind: 'user',
                at: '09:00',
                text: '',
                command: { id: 'jira-plan', ...STORY },
              },
            ],
          },
        ],
        askingIds: ['w1'],
        readSteps: { w1: { step: 'story', bytes: 0 } },
      });

      expect(renderHook(() => useChatViewModel()).result.current.readStatus).toBe(
        'Reading SHOP-12 from Jira…',
      );

      useWorkspaceStore.setState({
        readSteps: { w1: { step: 'files', bytes: 2 * 1024 * 1024 } },
      });

      expect(renderHook(() => useChatViewModel()).result.current.readStatus).toBe(
        'Downloading the files of SHOP-12: 2 MB',
      );
    });
  });

  describe('a plan from the code', () => {
    const LOJA = { id: '101', owner: 'acme', name: 'loja-web', baseBranch: 'develop' };

    beforeEach(() => {
      useAppStore.setState({ projects: [{ ...PROJECT, repositories: [LOJA] }] });
      useSetupStore.setState({
        integrations: [
          { id: 'github', account: 'octoqa', site: null, connectedAt: '2026-10-20' },
        ],
      });
    });

    it('offers to plan from the code once the project has a repository and GitHub is in', () => {
      answering({});

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.suggestions.map(({ label }) => label)).toContain(
        'Plan from the code',
      );

      useAppStore.setState({ projects: [PROJECT] });

      const { result: bare } = renderHook(() => useChatViewModel());

      expect(bare.current.suggestions.map(({ label }) => label)).not.toContain(
        'Plan from the code',
      );
    });

    it('sends the branch picked with the command, and keeps the command on the message', async () => {
      const ask = answering({ answer: DRAFTED });

      window.qazinho.listBranches = vi.fn().mockResolvedValue({
        isListed: true,
        branches: [
          { name: 'develop', isDefault: true, pullRequest: null, movedAt: null },
          { name: 'feat/cupom', isDefault: false, pullRequest: null, movedAt: null },
        ],
      });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.suggestions
          .find(({ label }) => label === 'Plan from the code')
          ?.onClick();
      });

      await waitFor(() => {
        expect(result.current.commandPicker?.rows.map(({ id }) => id)).toEqual([
          'develop',
          'feat/cupom',
        ]);
      });

      act(() => {
        result.current.onPickCommand('feat/cupom');
      });
      act(() => {
        result.current.onDraftChange('Focus on the coupon.');
      });
      act(() => {
        result.current.onSend();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0]).toMatchObject({
        text: 'Plan the tests for what branch feat/cupom of acme/loja-web changed against develop.\n\nFocus on the coupon.',
        code: { owner: 'acme', name: 'loja-web', base: 'develop', branch: 'feat/cupom' },
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.chat[0]).toMatchObject({
        kind: 'user',
        text: 'Focus on the coupon.',
        command: { repository: 'acme/loja-web', branch: 'feat/cupom', base: 'develop' },
      });
      expect(result.current.command).toBeNull();
    });

    it('keeps the code a plan was made from with the plan', async () => {
      const source = {
        repository: 'acme/loja-web',
        branch: 'feat/cupom',
        base: 'develop',
        commit: 'c0ffee0123',
      };

      answering({ answer: DRAFTED, code: source });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onSuggestion('Write it.');
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.planSource).toEqual(source);
      });
    });

    it('says how copying the code goes while the agent waits for it', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([]),
            chat: [
              {
                id: 'm-1',
                kind: 'user',
                at: '09:00',
                text: '',
                command: {
                  id: 'code-plan',
                  repository: 'acme/loja-web',
                  branch: 'feat/cupom',
                  base: 'develop',
                },
              },
            ],
          },
        ],
        askingIds: ['w1'],
        readSteps: { w1: { step: 'download', bytes: 3.25 * 1024 * 1024 } },
      });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.readStatus).toBe(
        'Downloading the code of acme/loja-web: 3.3 MB',
      );

      useWorkspaceStore.setState({ readSteps: { w1: { step: 'diff', bytes: 0 } } });

      expect(renderHook(() => useChatViewModel()).result.current.readStatus).toBe(
        'Reading what changed since develop…',
      );
    });
  });

  /**
   * Abrir um app de celular para olhá-lo pode levar quase um minuto: o QA vê por que o
   * chat espera.
   */
  describe('a look at a phone app', () => {
    it('says the app is being opened on the emulator while the agent waits on it', () => {
      useWorkspaceStore.setState({
        workspaces: [makeWorkspace([])],
        askingIds: ['w1'],
        liveTexts: {},
        lookingAt: { w1: 'android' },
      });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.lookStatus).toBe(
        'Opening the app on the emulator to see its first screen…',
      );
    });

    it('does NOT say it once the agent answered, or for another workspace', () => {
      useWorkspaceStore.setState({
        workspaces: [makeWorkspace([])],
        askingIds: [],
        lookingAt: { w1: 'ios' },
      });

      expect(renderHook(() => useChatViewModel()).result.current.lookStatus).toBe('');

      useWorkspaceStore.setState({ askingIds: ['w1'], lookingAt: { w2: 'ios' } });

      expect(renderHook(() => useChatViewModel()).result.current.lookStatus).toBe('');
    });
  });
});

describe('useChatViewModel, files the QA attaches', () => {
  const SHOT = {
    id: 'a1',
    name: 'erro.png',
    file: 'a1-erro.png',
    kind: 'image' as const,
    size: 3,
    preview: 'data:image/jpeg;base64,x',
  };

  /** Uma bridge que guarda o que o QA colou e devolve o anexo, como a main faria. */
  function attaching() {
    const ask = answering({});
    const attachData = vi.fn(() =>
      Promise.resolve({ isAttached: true as const, attachments: [SHOT] }),
    );

    window.qazinho = { ...fakeQazinhoApi('darwin'), askAgent: ask, attachData };

    return { ask, attachData };
  }

  it('sends what the QA pasted with the message, to the chat and to the agent', async () => {
    const { ask, attachData } = attaching();
    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.onFiles([new File(['png'], 'erro.png', { type: 'image/png' })]);
    });

    await waitFor(() => {
      expect(result.current.attachments).toEqual([
        {
          key: 'a1',
          name: 'erro.png',
          preview: 'data:image/jpeg;base64,x',
          removeLabel: expect.any(String),
        },
      ]);
    });
    expect(attachData).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'w1', name: 'erro.png' }),
    );

    act(() => {
      result.current.onSend();
    });

    await waitFor(() => {
      expect(ask).toHaveBeenCalled();
    });
    expect(ask.mock.calls[0]?.[0].attachments).toEqual([SHOT]);
    expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(0)).toMatchObject({
      kind: 'user',
      attachments: [SHOT],
    });
    expect(result.current.attachments).toEqual([]);
  });

  it('takes a file out before the message goes', async () => {
    attaching();
    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.onFiles([new File(['png'], 'erro.png')]);
    });
    await waitFor(() => {
      expect(result.current.attachments).toHaveLength(1);
    });
    act(() => {
      result.current.onRemoveAttachment('a1');
    });

    expect(result.current.attachments).toEqual([]);
  });

  it('says a file is too big without sending it to main', () => {
    const { attachData } = attaching();
    const { result } = renderHook(() => useChatViewModel());
    const huge = new File(['x'], 'video.mov');

    Object.defineProperty(huge, 'size', { value: 21 * 1024 * 1024 });

    act(() => {
      result.current.onFiles([huge]);
    });

    expect(attachData).not.toHaveBeenCalled();
    expect(result.current.attachNotice).not.toBe('');
  });

  /** Um arquivo fica na pasta de um workspace: ele não vai junto com a mensagem de outro. */
  it('does NOT carry a file into another workspace', async () => {
    attaching();
    useWorkspaceStore.setState({
      workspaces: [makeWorkspace([]), { ...makeWorkspace([]), id: 'w2' }],
    });

    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.onFiles([new File(['png'], 'erro.png')]);
    });
    await waitFor(() => {
      expect(result.current.attachments).toHaveLength(1);
    });
    act(() => {
      useAppStore.setState({ selectedWorkspaceId: 'w2' });
    });

    expect(result.current.attachments).toEqual([]);
  });
});
