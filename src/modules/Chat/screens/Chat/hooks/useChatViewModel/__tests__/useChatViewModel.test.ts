// @vitest-environment jsdom
import type { IAskAgent, IChatAnswer, IChatQuestion, IChatTurn } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
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
      ['Explore the app for 10 min', ''],
      ['Check against a Figma design', ''],
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

    /** A plan the chat wrote mid-run replaced the one main was walking: the run's report came back under the wrong cases. */
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

      expect(sectionOf(renderHook(() => useChatViewModel()).result.current)?.title).toBe(
        'Run r-01 · stopped · 1 passed · 1 failed',
      );
    });

    it('keeps the plain title for a run that walked it all', () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      });

      expect(sectionOf(renderHook(() => useChatViewModel()).result.current)?.title).toBe(
        'Run r-01 · 1 passed · 0 failed',
      );
    });

    it('counts one case in the singular, in Portuguese too', async () => {
      answering({});
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      });
      await i18n.changeLanguage('pt');

      const title = sectionOf(renderHook(() => useChatViewModel()).result.current)?.title;

      await i18n.changeLanguage('en');
      expect(title).toBe('Run r-01 · 1 passou · 0 falharam');
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
        title: 'Run r-01 · running · step 3 of 6',
        isLive: true,
        isExpanded: false,
        isExpandable: true,
        countLabel: '2 messages',
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
        tab: 'runs',
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
        { kind: 'run', id: 'r-01', title: 'The whole plan · 09:41' },
      ]);
    });
  });

  describe('onOpenBug', () => {
    it('opens the bug a run filed on the side of a step, in Bugs', () => {
      answering({});
      useWorkspaceStore.setState({ openBugId: null, tab: 'chat' });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onOpenBug('BUG-09');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        openBugId: 'BUG-09',
        tab: 'bugs',
      });
    });

    it('does NOT fold the bug when it was already open', () => {
      answering({});
      useWorkspaceStore.setState({ openBugId: 'BUG-09', tab: 'chat' });

      const { result } = renderHook(() => useChatViewModel());

      act(() => {
        result.current.onOpenBug('BUG-09');
      });

      expect(useWorkspaceStore.getState().openBugId).toBe('BUG-09');
    });
  });

  describe('a chat while a run goes', () => {
    it('does NOT send, and says the run has to end or be stopped first', () => {
      const ask = answering({});

      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      const { result } = renderHook(() => useChatViewModel());

      expect(result.current.lockedText).toBe(
        'A run is going: stop it, or wait for it to end, to talk to the agent.',
      );

      act(() => {
        result.current.onDraftChange('What is it doing?');
      });
      act(() => {
        result.current.onSend();
      });

      expect(ask).not.toHaveBeenCalled();
      expect(useWorkspaceStore.getState().workspaces[0]?.chat).toHaveLength(0);
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
      expect(result.current.lockedText).toBe(
        'The agent waits on your answer, just above.',
      );
      expect(
        result.current.items.find((item) => item.kind === 'run') as { title?: string },
      ).toMatchObject({ title: 'Run r-01 · waiting for you · step 2 of 6' });
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

    /** A first run in a new workspace walked behind the empty chat's welcome, its question unseen. */
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
        'Downloading the files of SHOP-12 · 2 MB',
      );
    });
  });

  describe('a plan from the code', () => {
    const LOJA = { owner: 'acme', name: 'loja-web', baseBranch: 'develop' };

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
        'Downloading the code of acme/loja-web · 3.3 MB',
      );

      useWorkspaceStore.setState({ readSteps: { w1: { step: 'diff', bytes: 0 } } });

      expect(renderHook(() => useChatViewModel()).result.current.readStatus).toBe(
        'Reading what changed since develop…',
      );
    });
  });

  /** Opening a phone app to look at it can take most of a minute: the QA sees why the chat waits. */
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
