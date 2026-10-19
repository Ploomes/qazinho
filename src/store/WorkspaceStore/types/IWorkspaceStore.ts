import type { BugFilter } from '@/modules/Bug';
import type { IQuestionAnswer } from '@/modules/Chat';
import type { ViewportId } from '@/modules/Device';
import type { ITestCase } from '@/modules/Plan';
import type { RunFilter } from '@/modules/Run';
import type { IWalkedBy, IWorkspace, WorkspaceTab } from '@/modules/Workspace';
import type {
  IChatQuestion,
  IRunFinding,
  IRunInFlight,
  IStepOutcome,
} from '@/shared/types';

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
  removingWorkspaceId: string | null;
  addWorkspace: (workspace: IWorkspace) => void;
  loadWorkspaces: (workspaces: IWorkspace[]) => void;
  askRemoveWorkspace: (workspaceId: string | null) => void;
  removeWorkspace: (workspaceId: string) => void;
  renameWorkspace: (props: { workspaceId: string; name: string }) => void;
  setViewport: (props: { workspaceId: string; viewportId: ViewportId }) => void;
  removeWorkspacesOf: (projectId: string) => void;
  selectTab: (tab: WorkspaceTab) => void;
  sendMessage: (props: { workspaceId: string; text: string; mentions: string[] }) => void;
  landAgentText: (props: {
    workspaceId: string;
    text: string;
    who: string;
    sessionId: string | null;
  }) => void;
  landPlan: (props: {
    workspaceId: string;
    summary: string;
    plan: ITestCase[];
    who: string;
    sessionId: string | null;
  }) => void;
  landQuestions: (props: { workspaceId: string; questions: IChatQuestion[] }) => void;
  answerQuestions: (props: {
    workspaceId: string;
    messageId: string;
    answers: IQuestionAnswer[];
  }) => void;
  landAgentError: (props: { workspaceId: string; text: string }) => void;
  setLiveText: (text: string) => void;
  answerAsk: (props: { workspaceId: string; reply: string }) => void;
  setPlan: (props: { workspaceId: string; plan: ITestCase[] }) => void;
  startRun: (props: { workspaceId: string; runId: string; by: IWalkedBy }) => void;
  resumeRun: (props: { run: IRunInFlight; by: IWalkedBy }) => void;
  pauseRun: (workspaceId: string) => void;
  stopRun: (workspaceId: string) => void;
  markDoing: (props: { workspaceId: string; index: number }) => void;
  setContext: (props: { workspaceId: string; tokens: number; window: number }) => void;
  markStreaming: (props: { workspaceId: string; url: string }) => void;
  landNote: (props: { workspaceId: string; text: string; who: string }) => void;
  landCost: (props: { workspaceId: string; costUsd: number }) => void;
  landFinding: (props: { workspaceId: string; finding: IRunFinding }) => void;
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
