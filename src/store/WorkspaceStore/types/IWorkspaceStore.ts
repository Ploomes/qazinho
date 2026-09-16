import type { BugFilter } from '@/modules/Bug/types';
import type { ITestCase } from '@/modules/Plan/types';
import type { RunFilter } from '@/modules/Run/types';
import type { IWorkspace, WorkspaceTab } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/types';

/** The workspaces and everything the QA can poke inside one of them. */
export interface IWorkspaceStore {
  workspaces: IWorkspace[];
  isLoaded: boolean;
  tab: WorkspaceTab;
  openCaseId: string | null;
  openBugId: string | null;
  selectedRunId: string | null;
  runFilter: RunFilter;
  bugFilter: BugFilter;
  isDevicePanelOpen: boolean;
  deviceWidth: number;
  isAgentTyping: boolean;
  liveText: string;
  addWorkspace: (workspace: IWorkspace) => void;
  loadWorkspaces: (workspaces: IWorkspace[]) => void;
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
  setLiveText: (text: string) => void;
  answerAsk: (props: { workspaceId: string; reply: string }) => void;
  reorderPlan: (props: { workspaceId: string; plan: ITestCase[] }) => void;
  startRun: (props: { workspaceId: string; runId: string }) => void;
  pauseRun: (workspaceId: string) => void;
  stopRun: (workspaceId: string) => void;
  markDoing: (props: { workspaceId: string; index: number }) => void;
  landStep: (outcome: IStepOutcome) => void;
  landRunDone: (workspaceId: string) => void;
  landRunFailed: (props: { workspaceId: string; text: string }) => void;
  tickClock: () => void;
  toggleCase: (caseId: string) => void;
  toggleBug: (bugId: string) => void;
  selectRun: (runId: string | null) => void;
  setRunFilter: (filter: RunFilter) => void;
  setBugFilter: (filter: BugFilter) => void;
  toggleDevicePanel: () => void;
  setDeviceWidth: (width: number) => void;
}
