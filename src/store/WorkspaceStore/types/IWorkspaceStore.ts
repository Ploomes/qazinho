import type { BugFilter, IBugReview } from '@/modules/Bug';
import type { IQuestionAnswer, UserCommand } from '@/modules/Chat';
import type { ViewportId } from '@/modules/Device';
import type { IPublishedPlan, ITestCase } from '@/modules/Plan';
import type { IWalkedBy, IWorkspace, PanelTab, WorkspaceTab } from '@/modules/Workspace';
import type {
  CodeStep,
  IChatQuestion,
  ICodeSource,
  IConfluencePageRef,
  IDesignLink,
  IDraftedCase,
  IFiledIssue,
  IJiraIssueRef,
  IRunAsked,
  IRunFinding,
  IRunInFlight,
  IRunQuestion,
  IRunVideo,
  IStepOutcome,
  IUnreadPlan,
  JiraStep,
} from '@/shared/types';

/** Os workspaces e tudo o que o QA pode mexer dentro de um deles. */
export interface IWorkspaceStore {
  workspaces: IWorkspace[];
  isLoaded: boolean;
  panelTab: PanelTab;
  openCaseId: string | null;
  openBugId: string | null;
  selectedRunId: string | null;
  bugFilter: BugFilter;
  isPanelOpen: boolean;
  isPanelWide: boolean;
  panelWidth: number;
  askingIds: string[];
  liveTexts: Record<string, string>;
  retries: Record<string, { attempt: number; maxRetries: number }>;
  readSteps: Record<string, { step: CodeStep | JiraStep; bytes: number }>;
  lookingAt: Record<string, 'android' | 'ios'>;
  removingWorkspaceId: string | null;
  addWorkspace: (workspace: IWorkspace) => void;
  loadWorkspaces: (workspaces: IWorkspace[]) => void;
  askRemoveWorkspace: (workspaceId: string | null) => void;
  removeWorkspace: (workspaceId: string) => void;
  renameWorkspace: (props: { workspaceId: string; name: string }) => void;
  setDesign: (props: { workspaceId: string; design: IDesignLink | null }) => void;
  setUnreadPlan: (props: { workspaceId: string; unreadPlan: IUnreadPlan | null }) => void;
  keepPlain: (props: { workspaceId: string; value: string }) => void;
  dismissBug: (props: {
    workspaceId: string;
    bugId: string;
    isDismissed: boolean;
  }) => void;
  setPublished: (props: {
    workspaceId: string;
    published: IPublishedPlan | null;
  }) => void;
  setViewport: (props: { workspaceId: string; viewportId: ViewportId }) => void;
  removeWorkspacesOf: (projectId: string) => void;
  selectTab: (tab: WorkspaceTab) => void;
  sendMessage: (props: {
    workspaceId: string;
    text: string;
    mentions: string[];
    command?: UserCommand;
  }) => void;
  landAgentText: (props: {
    workspaceId: string;
    text: string;
    who: string;
    agentId: string;
    sessionId: string | null;
  }) => void;
  landPlan: (props: {
    workspaceId: string;
    summary: string;
    plan: ITestCase[];
    source: ICodeSource | null;
    story: IJiraIssueRef | null;
    page: IConfluencePageRef | null;
    who: string;
    agentId: string;
    sessionId: string | null;
  }) => void;
  landQuestions: (props: { workspaceId: string; questions: IChatQuestion[] }) => void;
  answerQuestions: (props: {
    workspaceId: string;
    messageId: string;
    answers: IQuestionAnswer[];
  }) => void;
  landAgentError: (props: { workspaceId: string; text: string }) => void;
  landAgentStopped: (workspaceId: string) => void;
  setLiveText: (props: { workspaceId: string; text: string }) => void;
  setRetry: (props: { workspaceId: string; attempt: number; maxRetries: number }) => void;
  setReadStep: (props: {
    workspaceId: string;
    step: CodeStep | JiraStep;
    bytes: number;
  }) => void;
  setLooking: (props: { workspaceId: string; device: 'android' | 'ios' }) => void;
  setPlan: (props: { workspaceId: string; plan: ITestCase[] }) => void;
  startRun: (props: {
    workspaceId: string;
    runId: string;
    by: IWalkedBy;
    kind?: 'explore';
    caseIds?: string[];
  }) => void;
  landExplored: (props: {
    workspaceId: string;
    summary: string;
    cases: IDraftedCase[];
  }) => void;
  takeSuggestion: (props: {
    workspaceId: string;
    messageId: string;
    only?: number[];
  }) => void;
  resumeRun: (props: { run: IRunInFlight; by: IWalkedBy }) => void;
  pauseRun: (workspaceId: string) => void;
  stopRun: (workspaceId: string) => void;
  markDoing: (props: { workspaceId: string; index: number }) => void;
  setContext: (props: { workspaceId: string; tokens: number; window: number }) => void;
  markStreaming: (props: { workspaceId: string; url: string }) => void;
  landNote: (props: { workspaceId: string; text: string; who: string }) => void;
  landCost: (props: { workspaceId: string; costUsd: number }) => void;
  landFinding: (props: { workspaceId: string; finding: IRunFinding }) => void;
  landAsked: (props: { workspaceId: string; question: IRunQuestion }) => void;
  landAnswered: (props: { workspaceId: string; asked: IRunAsked }) => void;
  landStep: (outcome: IStepOutcome) => void;
  landRunDone: (workspaceId: string) => void;
  landVideo: (props: { workspaceId: string; runId: string; video: IRunVideo }) => void;
  landRunFailed: (props: { workspaceId: string; text: string }) => void;
  tickClock: () => void;
  toggleCase: (caseId: string) => void;
  toggleBug: (bugId: string) => void;
  landFiled: (props: { workspaceId: string; bugId: string; issue: IFiledIssue }) => void;
  landReview: (props: { workspaceId: string; bugId: string; review: IBugReview }) => void;
  selectRun: (runId: string | null) => void;
  setBugFilter: (filter: BugFilter) => void;
  togglePanel: () => void;
  togglePanelWide: () => void;
  setPanelWidth: (width: number) => void;
}
