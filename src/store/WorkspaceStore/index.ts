import type { IWorkspaceStore } from './types';
import { create } from 'zustand';
import {
  answerAsk,
  answerRound,
  appendAgentError,
  appendAgentMessage,
  appendPlanCard,
  appendQuestions,
  appendRunNote,
  appendUserMessage,
  formatClock,
} from '@/modules/Chat/library';
import { DEVICE } from '@/modules/Device/constants';
import { RUN_CLOCK } from '@/modules/Run/constants';
import {
  endRun,
  landCost,
  landFinding,
  landStep,
  resumeRun,
  startRun,
} from '@/modules/Workspace/library';
import { mapWorkspace, tickWorkspaces } from './library';

export const useWorkspaceStore = create<IWorkspaceStore>((set) => ({
  workspaces: [],
  isLoaded: false,
  tab: 'chat',
  openCaseId: null,
  openBugId: null,
  selectedRunId: null,
  runFilter: 'all',
  bugFilter: 'all',
  isDevicePanelOpen: true,
  deviceWidth: DEVICE.defaultWidth,
  isAgentTyping: false,
  liveText: '',
  removingWorkspaceId: null,

  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace], tab: 'chat' })),

  loadWorkspaces: (workspaces) => set({ workspaces, isLoaded: true }),

  askRemoveWorkspace: (removingWorkspaceId) => set({ removingWorkspaceId }),

  removeWorkspace: (workspaceId) =>
    set((state) => ({
      removingWorkspaceId: null,
      workspaces: state.workspaces.filter(({ id }) => id !== workspaceId),
    })),

  renameWorkspace: ({ workspaceId, name }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, name }),
      }),
    })),

  setViewport: ({ workspaceId, viewportId }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, viewportId }),
      }),
    })),

  removeWorkspacesOf: (projectId) =>
    set((state) => ({
      workspaces: state.workspaces.filter(
        (workspace) => workspace.projectId !== projectId,
      ),
    })),

  selectTab: (tab) => set({ tab }),

  setLiveText: (liveText) => set({ liveText }),

  sendMessage: ({ workspaceId, text, mentions }) =>
    set((state) => ({
      isAgentTyping: true,
      liveText: '',
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendUserMessage({ workspace, text, mentions, at: formatClock(new Date()) }),
      }),
    })),

  landAgentText: ({ workspaceId, text, who, sessionId }) =>
    set((state) => ({
      isAgentTyping: false,
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({
          ...appendAgentMessage({ workspace, text, who, at: formatClock(new Date()) }),
          sessionId: sessionId ?? workspace.sessionId,
        }),
      }),
    })),

  landPlan: ({ workspaceId, summary, plan, who, sessionId }) =>
    set((state) => ({
      isAgentTyping: false,
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => {
          const said = appendAgentMessage({
            workspace,
            text: summary,
            who,
            at: formatClock(new Date()),
          });

          return {
            ...appendPlanCard({ workspace: said, plan, at: formatClock(new Date()) }),
            sessionId: sessionId ?? workspace.sessionId,
          };
        },
      }),
    })),

  landQuestions: ({ workspaceId, questions }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendQuestions({ workspace, questions, at: formatClock(new Date()) }),
      }),
    })),

  answerQuestions: ({ workspaceId, messageId, answers }) =>
    set((state) => ({
      isAgentTyping: true,
      liveText: '',
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => answerRound({ workspace, messageId, answers }),
      }),
    })),

  landAgentError: ({ workspaceId, text }) =>
    set((state) => ({
      isAgentTyping: false,
      liveText: '',
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendAgentError({ workspace, text, at: formatClock(new Date()) }),
      }),
    })),

  answerAsk: ({ workspaceId, reply }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          answerAsk({ workspace, reply, at: formatClock(new Date()) }),
      }),
    })),

  setPlan: ({ workspaceId, plan }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({ ...workspace, plan }),
      }),
    })),

  startRun: ({ workspaceId, runId, by }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          startRun({ workspace, runId, by, startedAt: formatClock(new Date()) }),
      }),
    })),

  resumeRun: ({ run, by }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId: run.workspaceId,
        change: (workspace) =>
          resumeRun({
            workspace,
            run,
            by,
            now: Date.now(),
            startedAt: formatClock(new Date(run.startedAtMs)),
          }),
      }),
    })),

  pauseRun: (workspaceId) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live
            ? {
                ...workspace,
                live: { ...workspace.live, isRunning: !workspace.live.isRunning },
              }
            : workspace,
      }),
    })),

  stopRun: (workspaceId) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          endRun({ workspace, at: formatClock(new Date()), endedBy: 'stopped' }),
      }),
    })),

  markDoing: ({ workspaceId, index }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live
            ? { ...workspace, live: { ...workspace.live, doingIndex: index } }
            : workspace,
      }),
    })),

  setContext: ({ workspaceId, tokens, window }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          window > 0 ? { ...workspace, context: { tokens, window } } : workspace,
      }),
    })),

  landNote: ({ workspaceId, text, who }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendRunNote({ workspace, text, who, at: formatClock(new Date()) }),
      }),
    })),

  landCost: ({ workspaceId, costUsd }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => landCost({ workspace, costUsd }),
      }),
    })),

  landFinding: ({ workspaceId, finding }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          landFinding({ workspace, finding, at: formatClock(new Date()) }),
      }),
    })),

  markStreaming: ({ workspaceId, url }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          workspace.live
            ? workspace.live.isDone
              ? workspace
              : { ...workspace, live: { ...workspace.live, streamUrl: url } }
            : workspace,
      }),
    })),

  landStep: (outcome) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId: outcome.workspaceId,
        change: (workspace) =>
          landStep({ workspace, outcome, at: formatClock(new Date()) }),
      }),
    })),

  landRunDone: (workspaceId) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          endRun({ workspace, at: formatClock(new Date()), endedBy: 'finished' }),
      }),
    })),

  landRunFailed: ({ workspaceId, text }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => {
          const at = formatClock(new Date());
          const ended = endRun({
            workspace: appendAgentError({
              workspace,
              text,
              at,
              runId: workspace.live?.isDone === false ? workspace.live.id : null,
            }),
            at,
            endedBy: 'broke',
          });

          return ended.live === workspace.live ? { ...ended, status: 'stopped' } : ended;
        },
      }),
    })),

  tickClock: () =>
    set((state) => {
      const workspaces = tickWorkspaces({
        workspaces: state.workspaces,
        seconds: RUN_CLOCK.tickMs / 1_000,
      });

      return workspaces === state.workspaces ? state : { workspaces };
    }),

  toggleCase: (caseId) =>
    set((state) => ({ openCaseId: state.openCaseId === caseId ? null : caseId })),

  toggleBug: (bugId) =>
    set((state) => ({ openBugId: state.openBugId === bugId ? null : bugId })),

  selectRun: (runId) => set({ selectedRunId: runId }),

  setRunFilter: (runFilter) => set({ runFilter }),

  setBugFilter: (bugFilter) => set({ bugFilter }),

  toggleDevicePanel: () =>
    set((state) => ({ isDevicePanelOpen: !state.isDevicePanelOpen })),

  setDeviceWidth: (width) =>
    set({ deviceWidth: Math.min(Math.max(width, DEVICE.minWidth), DEVICE.maxWidth) }),
}));
