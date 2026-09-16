import type { BugFilter } from '@/modules/Bug/types';
import type { RunFilter } from '@/modules/Run/types';
import type { IWorkspace, WorkspaceTab } from '@/modules/Workspace/types';

/** The workspaces and everything the QA can poke inside one of them. */
export interface IWorkspaceStore {
  workspaces: IWorkspace[];
  tab: WorkspaceTab;
  openCaseId: string | null;
  openBugId: string | null;
  selectedRunId: string | null;
  runFilter: RunFilter;
  bugFilter: BugFilter;
  isDevicePanelOpen: boolean;
  deviceWidth: number;
  isAgentTyping: boolean;
  addWorkspace: (workspace: IWorkspace) => void;
  selectTab: (tab: WorkspaceTab) => void;
  sendMessage: (props: { workspaceId: string; text: string }) => void;
  replyToQa: (props: { workspaceId: string; kind: 'web' | 'mobile' }) => void;
  answerAsk: (props: { workspaceId: string; reply: string }) => void;
  startRun: (workspaceId: string) => void;
  pauseRun: (workspaceId: string) => void;
  stopRun: (workspaceId: string) => void;
  tick: () => void;
  toggleCase: (caseId: string) => void;
  toggleBug: (bugId: string) => void;
  selectRun: (runId: string | null) => void;
  setRunFilter: (filter: RunFilter) => void;
  setBugFilter: (filter: BugFilter) => void;
  toggleDevicePanel: () => void;
  setDeviceWidth: (width: number) => void;
}
