import type { IWorkspaceStore } from './types';
import { appendUserMessage, formatClock } from '@/modules/Chat/library';
import { DEVICE } from '@/modules/Device/constants';
import { advanceRun, startRun } from '@/modules/Workspace/library';
import { create } from 'zustand';
import { mapWorkspace } from './library';

export const useWorkspaceStore = create<IWorkspaceStore>((set) => ({
  workspaces: [],
  tab: 'chat',
  openCaseId: null,
  openBugId: null,
  selectedRunId: null,
  runFilter: 'all',
  bugFilter: 'all',
  isDevicePanelOpen: true,
  deviceWidth: DEVICE.defaultWidth,
  isAgentTyping: false,

  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace], tab: 'chat' })),

  selectTab: (tab) => set({ tab }),

  sendMessage: ({ workspaceId, text }) =>
    set((state) => ({
      isAgentTyping: true,
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          appendUserMessage({ workspace, text, at: formatClock(new Date()) }),
      }),
    })),

  startRun: (workspaceId) =>
    set((state) => ({
      workspaces: mapWorkspace({
        workspaces: state.workspaces,
        workspaceId,
        change: (workspace) =>
          startRun({ workspace, startedAt: formatClock(new Date()) }),
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
          workspace.live
            ? {
                ...workspace,
                status: 'stopped',
                live: { ...workspace.live, isRunning: false, isDone: true },
              }
            : workspace,
      }),
    })),

  tick: () => set((state) => ({ workspaces: state.workspaces.map(advanceRun) })),

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
