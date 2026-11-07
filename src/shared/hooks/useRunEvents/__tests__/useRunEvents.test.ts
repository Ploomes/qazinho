// @vitest-environment jsdom
import type { IRunEvent, IRunInFlight, IRunRef } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useRunEvents } from '@/shared/hooks/useRunEvents';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

const RUN: IRunInFlight = {
  workspaceId: 'w1',
  runId: 'r-03',
  startedAtMs: Date.now() - 60_000,
  doingIndex: 1,
  streamUrl: 'http://127.0.0.1:5000/t/w1',
  address: null,
  outcomes: [],
  isPaused: false,
  costUsd: 0.12,
  findings: [],
  agentId: 'claude-code',
  model: 'sonnet',
  targetKind: 'web',
  isExploring: false,
  question: null,
  asked: [],
};

const JIRA = {
  id: 'jira' as const,
  account: 'qa@acme.com',
  site: 'acme.atlassian.net',
  connectedAt: '',
};

/** Uma página que abriu enquanto a main ainda andava uma run: a bridge diz isso. */
function bridgeWithRunInFlight() {
  const runsInFlight = vi.fn(() => Promise.resolve([RUN]));

  window.qazinho = { ...fakeQazinhoApi('darwin'), runsInFlight };

  return runsInFlight;
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()], isLoaded: false });
});

describe('useRunEvents', () => {
  it('picks up a run main is still walking, once the workspaces are read from disk', async () => {
    const runsInFlight = bridgeWithRunInFlight();

    renderHook(() => {
      useRunEvents();
    });

    expect(runsInFlight).not.toHaveBeenCalled();

    useWorkspaceStore.setState({ isLoaded: true });

    await waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces[0]?.live).toMatchObject({
        id: 'r-03',
        doingIndex: 1,
        isRunning: true,
        streamUrl: 'http://127.0.0.1:5000/t/w1',
        costUsd: 0.12,
      });
    });
    expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
  });

  it('picks the run up with the agent and model main walks it with, as the QA calls them', async () => {
    bridgeWithRunInFlight();
    useMachineStore.setState({
      agents: [
        {
          id: 'claude-code',
          name: 'Claude Code',
          command: 'claude',
          isFound: true,
          path: '/usr/local/bin/claude',
          defaultModel: null,
          isSignedIn: true,
        },
      ],
    });

    renderHook(() => {
      useRunEvents();
    });
    useWorkspaceStore.setState({ isLoaded: true });

    await waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces[0]?.live?.by).toEqual({
        agent: 'Claude Code',
        modelName: 'Sonnet',
        targetKind: 'web',
      });
    });
    useMachineStore.setState({ agents: [] });
  });

  /**
   * Uma run que não conseguia abrir o app punha no chat as próprias palavras do
   * Playwright: "page.goto: net::ERR_UNSAFE_PORT … Call log: …", em inglês seja qual for
   * o idioma do QA.
   */
  it("says why a run stopped in the QA's language, with the address it could not open", async () => {
    let send: (event: IRunEvent) => void = () => undefined;

    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      onRunEvent: (listener) => {
        send = listener;

        return () => undefined;
      },
    };
    useWorkspaceStore.setState({
      workspaces: [
        startRun({
          workspace: makeWorkspace(),
          startedAt: '09:41',
          runId: 'r-01',
          by: WALKED_BY,
        }),
      ],
    });
    await i18n.changeLanguage('pt');

    renderHook(() => {
      useRunEvents();
    });

    act(() => {
      send({
        kind: 'failed',
        workspaceId: 'w1',
        failure: {
          reason: 'unreachable',
          url: 'http://127.0.0.1:3000/',
          code: 'ERR_CONNECTION_REFUSED',
        },
      });
    });

    expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
      kind: 'error',
      text: 'O Chrome não conseguiu abrir http://127.0.0.1:3000/ (ERR_CONNECTION_REFUSED). Confira se o app está no ar e se esta máquina o alcança, e rode o plano de novo.',
    });
    await i18n.changeLanguage('en');
  });

  describe('a run that ends', () => {
    /**
     * Uma bridge que entrega ao teste os eventos de run da main e os cliques nas
     * notificações dela.
     */
    function listening() {
      let send: (event: IRunEvent) => void = () => undefined;
      let open: (run: IRunRef) => void = () => undefined;
      const alertRun = vi.fn();

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        onRunEvent: (listener) => {
          send = listener;

          return () => undefined;
        },
        onOpenRun: (listener) => {
          open = listener;

          return () => undefined;
        },
        alertRun,
      };
      renderHook(() => {
        useRunEvents();
      });

      return {
        alertRun,
        send: (event: IRunEvent) => {
          act(() => {
            send(event);
          });
        },
        open: (run: IRunRef) => {
          act(() => {
            open(run);
          });
        },
      };
    }

    beforeEach(async () => {
      await i18n.changeLanguage('en');
      useAppStore.setState({
        runNotice: null,
        screen: 'welcome',
        selectedWorkspaceId: null,
      });
      useSettingsStore.setState({ runAlert: 'system' });
      useWorkspaceStore.setState({
        workspaces: [
          walkRun({ verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'] }),
        ],
      });
    });

    it('says so in the app, and asks main to call the QA back if they are away', () => {
      const { alertRun, send } = listening();

      send({ kind: 'done', workspaceId: 'w1' });

      expect(useAppStore.getState().runNotice).toMatchObject({
        workspaceId: 'w1',
        runId: 'r-01',
      });
      expect(alertRun).toHaveBeenCalledWith({
        workspaceId: 'w1',
        runId: 'r-01',
        title: 'Run r-01 finished',
        body: 'Checkout regression · 1 failed · 1 passed · 1 bug',
      });
    });

    it('follows the address the agent took the tab to', () => {
      const { send } = listening();

      send({
        kind: 'address',
        workspaceId: 'w1',
        url: 'http://localhost:8000/templates',
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.live?.address).toBe(
        'http://localhost:8000/templates',
      );
    });

    it('keeps it inside the app when the QA asked for that', () => {
      useSettingsStore.setState({ runAlert: 'app' });

      const { alertRun, send } = listening();

      send({ kind: 'done', workspaceId: 'w1' });

      expect(useAppStore.getState().runNotice).not.toBeNull();
      expect(alertRun).not.toHaveBeenCalled();
    });

    it('says a run that broke on the way stopped short', () => {
      const { alertRun, send } = listening();

      send({ kind: 'failed', workspaceId: 'w1', failure: { reason: 'agent-silent' } });

      expect(alertRun).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Run r-01 stopped short' }),
      );
    });

    it('does NOT announce a run the QA stopped themselves', () => {
      const { alertRun, send } = listening();

      act(() => {
        useWorkspaceStore.getState().stopRun('w1');
      });
      send({ kind: 'done', workspaceId: 'w1' });

      expect(useAppStore.getState().runNotice).toBeNull();
      expect(alertRun).not.toHaveBeenCalled();
    });

    it('asks the QA’s agent about a filed bug the run caught again', async () => {
      const [first] = walkRun({
        verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
      }).bugs;
      const workspace = useWorkspaceStore.getState().workspaces[0]!;

      useWorkspaceStore.setState({
        workspaces: [
          {
            ...workspace,
            bugs: [
              {
                ...first!,
                filed: {
                  tracker: 'jira',
                  key: 'SHOP-57',
                  url: 'https://acme.atlassian.net/browse/SHOP-57',
                  at: '',
                },
                reviewedRuns: ['r-00'],
                sightings: [
                  {
                    runId: 'r-01',
                    runWhen: '09:41',
                    caseId: 'TC-02',
                    stepNumber: 2,
                    at: 1,
                    shot: { isBad: true, src: null, file: null },
                  },
                ],
              },
            ],
          },
        ],
      });

      const { send } = listening();
      const reviewBug = vi.fn().mockResolvedValue({
        isReviewed: true,
        verdict: 'nothing-new',
        reason: 'Same.',
        comment: '',
      });

      window.qazinho.reviewBug = reviewBug;
      useSetupStore.setState({ integrations: [JIRA] });
      send({ kind: 'done', workspaceId: 'w1' });

      await waitFor(() => {
        expect(reviewBug).toHaveBeenCalledWith(
          expect.objectContaining({
            workspaceId: 'w1',
            issue: expect.objectContaining({ key: 'SHOP-57' }),
          }),
        );
      });
    });

    it('asks again once the bug’s tracker connects', async () => {
      const [first] = walkRun({
        verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
      }).bugs;
      const workspace = useWorkspaceStore.getState().workspaces[0]!;

      useSetupStore.setState({ integrations: [] });
      useWorkspaceStore.setState({
        isLoaded: true,
        workspaces: [
          {
            ...workspace,
            bugs: [
              {
                ...first!,
                filed: {
                  tracker: 'jira',
                  key: 'SHOP-57',
                  url: 'https://acme.atlassian.net/browse/SHOP-57',
                  at: '',
                },
                reviewedRuns: ['r-00'],
                sightings: [
                  {
                    runId: 'r-01',
                    runWhen: '09:41',
                    caseId: 'TC-02',
                    stepNumber: 2,
                    at: 1,
                    shot: { isBad: true, src: null, file: null },
                  },
                ],
              },
            ],
          },
        ],
      });

      const reviewBug = vi.fn().mockResolvedValue({
        isReviewed: true,
        verdict: 'nothing-new',
        reason: 'Same.',
        comment: '',
      });

      window.qazinho = { ...fakeQazinhoApi('darwin'), reviewBug };
      renderHook(() => {
        useRunEvents();
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(reviewBug).not.toHaveBeenCalled();

      act(() => {
        useSetupStore.setState({ integrations: [JIRA] });
      });

      await waitFor(() => {
        expect(reviewBug).toHaveBeenCalledTimes(1);
      });
    });

    it('opens the run whose notification the QA clicked', () => {
      const { open, send } = listening();

      send({ kind: 'done', workspaceId: 'w1' });
      open({ workspaceId: 'w1', runId: 'r-01' });

      expect(useAppStore.getState()).toMatchObject({
        screen: 'workspace',
        selectedWorkspaceId: 'w1',
      });
      expect(useWorkspaceStore.getState()).toMatchObject({
        panelTab: 'runs',
        selectedRunId: 'r-01',
      });
    });
  });

  describe('a question from the run', () => {
    function listening() {
      let send: (event: IRunEvent) => void = () => undefined;
      let open: (run: IRunRef) => void = () => undefined;
      const alertRun = vi.fn();

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        onRunEvent: (listener) => {
          send = listener;

          return () => undefined;
        },
        onOpenRun: (listener) => {
          open = listener;

          return () => undefined;
        },
        alertRun,
      };
      renderHook(() => {
        useRunEvents();
      });

      return {
        alertRun,
        send: (event: IRunEvent) => {
          act(() => {
            send(event);
          });
        },
        open: (run: IRunRef) => {
          act(() => {
            open(run);
          });
        },
      };
    }

    beforeEach(async () => {
      await i18n.changeLanguage('en');
      useAppStore.setState({ screen: 'welcome', selectedWorkspaceId: null });
      useSettingsStore.setState({ runAlert: 'system' });
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });
    });

    it('holds the run on the question, and asks main to call the QA back if they are away', () => {
      const { alertRun, send } = listening();

      send({ kind: 'asked', workspaceId: 'w1', question: QUESTION });

      expect(useWorkspaceStore.getState().workspaces[0]?.live?.question).toMatchObject({
        id: 'q-1',
        waitedSec: 0,
      });
      expect(alertRun).toHaveBeenCalledWith({
        workspaceId: 'w1',
        runId: 'r-01',
        title: 'Checkout regression · the agent asks you something',
        body: 'Which plan should I pick?',
      });
    });

    it('keeps the question inside the app when the QA asked for that', () => {
      useSettingsStore.setState({ runAlert: 'app' });

      const { alertRun, send } = listening();

      send({ kind: 'asked', workspaceId: 'w1', question: QUESTION });

      expect(alertRun).not.toHaveBeenCalled();
    });

    it("lets the run go on once the question ended, and says so in the run's section", () => {
      const { send } = listening();

      send({ kind: 'asked', workspaceId: 'w1', question: QUESTION });
      send({
        kind: 'answered',
        workspaceId: 'w1',
        asked: {
          id: 'q-1',
          question: 'Which plan should I pick?',
          caseId: 'TC-01',
          stepNumber: 2,
          answer: { kind: 'secret', name: 'PLAN_CODE', isKept: false },
          askedAtMs: 1,
          answeredAtMs: 2,
        },
      });

      const workspace = useWorkspaceStore.getState().workspaces[0];

      expect(workspace?.live?.question).toBeUndefined();
      expect(workspace?.chat.at(-1)).toMatchObject({
        kind: 'ask',
        runId: 'r-01',
        answer: { kind: 'secret', name: 'PLAN_CODE' },
      });
    });

    /**
     * O plano dizia que LOGIN_PASSWORD faltava logo depois de o QA guardá-la numa
     * resposta.
     */
    it("reads the project's variables again once an answer was kept in it", async () => {
      useVariablesStore.setState({ byProject: {} });

      const { send } = listening();

      window.qazinho = {
        ...window.qazinho,
        listVariables: () =>
          Promise.resolve([
            { projectId: 'p1', variables: [{ name: 'LOGIN_PASSWORD', description: '' }] },
          ]),
      };
      send({ kind: 'asked', workspaceId: 'w1', question: QUESTION });
      send({
        kind: 'answered',
        workspaceId: 'w1',
        asked: {
          id: 'q-1',
          question: 'The password?',
          caseId: 'TC-01',
          stepNumber: 2,
          answer: { kind: 'secret', name: 'LOGIN_PASSWORD', isKept: true },
          askedAtMs: 1,
          answeredAtMs: 2,
        },
      });

      await waitFor(() => {
        expect(useVariablesStore.getState().byProject.p1).toEqual([
          { name: 'LOGIN_PASSWORD', description: '' },
        ]);
      });
    });

    it('opens the chat of a run still going when the QA clicks its notification', () => {
      const { open } = listening();

      useWorkspaceStore.setState({ isPanelOpen: false });
      open({ workspaceId: 'w1', runId: 'r-01' });

      expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
      expect(useWorkspaceStore.getState().isPanelOpen).toBe(true);
    });
  });
});
