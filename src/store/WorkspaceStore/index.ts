import type { IWorkspaceStore } from './types';
import { create } from 'zustand';
import {
  answerAsk,
  appendAgentError,
  appendAgentMessage,
  appendPlanCard,
  appendUserMessage,
  formatClock,
} from '@/modules/Chat/library';
import { DEVICE } from '@/modules/Device/constants';
import { RUN_CLOCK } from '@/modules/Run/constants';
import {
  finishRun,
  landStep,
  resumeRun,
  startRun,
  stopRun,
} from '@/modules/Workspace/library';
import { mapWorkspace, tickLive } from './library';

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

  startRun: ({ workspaceId, runId }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          startRun({ workspace, runId, startedAt: formatClock(new Date()) }),
      }),
    })),

  resumeRun: (run) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId: run.workspaceId,
        change: (workspace) =>
          resumeRun({
            workspace,
            run,
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
        change: stopRun,
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
          appendAgentMessage({ workspace, text, who, at: formatClock(new Date()) }),
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
        change: (workspace) => finishRun({ workspace, at: formatClock(new Date()) }),
      }),
    })),

  landRunFailed: ({ workspaceId, text }) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) => ({
          ...appendAgentError({ workspace, text, at: formatClock(new Date()) }),
          status: 'stopped',
          live: workspace.live
            ? {
                ...workspace.live,
                isRunning: false,
                isDone: true,
                doingIndex: -1,
                streamUrl: null,
              }
            : null,
        }),
      }),
    })),

  tickClock: () =>
    set((state) => ({
      workspaces: state.workspaces.map((workspace) =>
        tickLive({ workspace, seconds: RUN_CLOCK.tickMs / 1_000 }),
      ),
    })),

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
