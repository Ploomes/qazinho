import type { BugFilter } from '@/modules/Bug/types';
import type { ITestCase } from '@/modules/Plan/types';
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
  landAgentText: (props: {
    workspaceId: string;
    text: string;
    sessionId: string | null;
  }) => void;
  landPlan: (props: {
    workspaceId: string;
    summary: string;
    plan: ITestCase[];
    sessionId: string | null;
  }) => void;
  landAgentError: (props: { workspaceId: string; text: string }) => void;
  answerAsk: (props: { workspaceId: string; reply: string }) => void;
  reorderPlan: (props: { workspaceId: string; plan: ITestCase[] }) => void;
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
