import type { BugFilter, IBugReview } from '@/modules/Bug';
import type { IAgentActivity, IQuestionAnswer, UserCommand } from '@/modules/Chat';
import type { IBugFlash, ViewportId } from '@/modules/Device';
import type { IMemoryChange } from '@/modules/Memory/types';
import type {
  IChangeReview,
  IPendingChange,
  IPublishedPlan,
  ITestCase,
} from '@/modules/Plan';
import type {
  IWalkedBy,
  IWorkspace,
  PanelTab,
  StoryStage,
  WorkspaceTab,
} from '@/modules/Workspace';
import type {
  ISourceSnapshot,
  RunMode,
  CodeStep,
  IChatAttachment,
  IChatQuestion,
  ICodeSource,
  IConfluencePageRef,
  IDesignLink,
  IDraftedCase,
  IFiledIssue,
  IJiraIssueRef,
  IManualTurn,
  IPlanDoubt,
  IPlanStrategy,
  IRunAsked,
  IRunFinding,
  IRunInFlight,
  IRunQuestion,
  IRunScreen,
  IRunVideo,
  IStepOutcome,
  IUnreadPlan,
  JiraStep,
  RunHow,
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
  panelWidth: number;
  askingIds: string[];
  liveTexts: Record<string, string>;
  activities: Record<string, IAgentActivity[]>;
  bugFlashes: Record<string, IBugFlash[]>;
  bugFlashesLeaving: string[];
  developedCases: Record<string, string[]>;
  planFiles: Record<string, { name: string; size: number }[]>;
  unheardTalks: Record<string, string[]>;
  retries: Record<string, { attempt: number; maxRetries: number }>;
  readSteps: Record<string, { step: CodeStep | JiraStep; bytes: number }>;
  lookingAt: Record<string, 'android' | 'ios'>;
  chatDevices: Record<string, { streamUrl: string; address: string | null }>;
  storyReadAt: Record<string, number>;
  changeHold: { workspaceId: string; mode: RunMode; caseIds?: string[] } | null;
  removingWorkspaceId: string | null;
  addWorkspace: (workspace: IWorkspace) => void;
  loadWorkspaces: (workspaces: IWorkspace[]) => void;
  askRemoveWorkspace: (workspaceId: string | null) => void;
  removeWorkspace: (workspaceId: string) => void;
  landMemoryChanges: (props: { workspaceId: string; changes: IMemoryChange[] }) => void;
  landFollowedSkills: (props: { workspaceId: string; names: string[] }) => void;
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
  setTarget: (props: {
    workspaceId: string;
    targetId: string;
    planKind: 'web' | 'mobile';
  }) => void;
  removeWorkspacesOf: (projectId: string) => void;
  selectTab: (tab: WorkspaceTab) => void;
  sendMessage: (props: {
    workspaceId: string;
    text: string;
    mentions: string[];
    command?: UserCommand;
    from?: 'agent';
    attachments?: IChatAttachment[];
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
    strategy?: IPlanStrategy | null;
    snapshots?: ISourceSnapshot[];
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
  noteActivity: (props: { workspaceId: string; tool: string; target: string }) => void;
  shiftBugFlash: (props: { workspaceId: string; id: string }) => void;
  settleBugFlashes: (workspaceId: string) => void;
  clearBugFlashes: (workspaceId: string) => void;
  setRetry: (props: { workspaceId: string; attempt: number; maxRetries: number }) => void;
  setReadStep: (props: {
    workspaceId: string;
    step: CodeStep | JiraStep;
    bytes: number;
  }) => void;
  setLooking: (props: { workspaceId: string; device: 'android' | 'ios' }) => void;
  setChatDevice: (props: {
    workspaceId: string;
    streamUrl: string | null;
    address: string | null;
  }) => void;
  setPlan: (props: { workspaceId: string; plan: ITestCase[] }) => void;
  changePlan: (props: { workspaceId: string; plan: ITestCase[] }) => void;
  startRun: (props: {
    workspaceId: string;
    runId: string;
    by: IWalkedBy;
    kind?: 'explore';
    caseIds?: string[];
    mode?: RunMode;
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
  markDoing: (props: { workspaceId: string; index: number; how: RunHow }) => void;
  setDevelopedCases: (props: {
    workspaceId: string;
    caseIds: string[];
    files?: { name: string; size: number }[];
  }) => void;
  markDeveloped: (props: { workspaceId: string; caseId: string }) => void;
  talkToRun: (props: { workspaceId: string; text: string }) => void;
  markTalkHeard: (workspaceId: string) => void;
  landTalkReply: (props: { workspaceId: string; text: string; who: string }) => void;
  landUnheardTalks: (props: { workspaceId: string; texts: string[] }) => void;
  startAskingUnheard: (workspaceId: string) => void;
  setContext: (props: { workspaceId: string; tokens: number; window: number }) => void;
  markStreaming: (props: { workspaceId: string; url: string }) => void;
  markManual: (props: { workspaceId: string; turn: IManualTurn }) => void;
  setDoubts: (props: { workspaceId: string; doubts: IPlanDoubt[] }) => void;
  markStoryRead: (props: { workspaceId: string; at: number }) => void;
  setStoryStage: (props: { workspaceId: string; stage: StoryStage | null }) => void;
  setChanged: (props: { workspaceId: string; changed: IPendingChange | null }) => void;
  setReview: (props: { workspaceId: string; review: IChangeReview | null }) => void;
  resolveChanges: (workspaceId: string) => void;
  holdForChanges: (
    hold: { workspaceId: string; mode: RunMode; caseIds?: string[] } | null,
  ) => void;
  markScreens: (props: { workspaceId: string; screens: IRunScreen[] }) => void;
  markAddress: (props: { workspaceId: string; url: string }) => void;
  landNote: (props: { workspaceId: string; text: string; who: string }) => void;
  landCost: (props: { workspaceId: string; costUsd: number }) => void;
  landFinding: (props: { workspaceId: string; finding: IRunFinding }) => void;
  landAsked: (props: { workspaceId: string; question: IRunQuestion }) => void;
  landAnswered: (props: { workspaceId: string; asked: IRunAsked }) => void;
  landStep: (outcome: IStepOutcome) => void;
  landRunDone: (workspaceId: string) => void;
  landVideo: (props: { workspaceId: string; runId: string; video: IRunVideo }) => void;
  landRunFailed: (props: {
    workspaceId: string;
    text: string;
    detail?: string | null;
  }) => void;
  tickClock: () => void;
  toggleCase: (caseId: string) => void;
  toggleBug: (bugId: string) => void;
  landFiled: (props: { workspaceId: string; bugId: string; issue: IFiledIssue }) => void;
  landReview: (props: { workspaceId: string; bugId: string; review: IBugReview }) => void;
  selectRun: (runId: string | null) => void;
  setBugFilter: (filter: BugFilter) => void;
  togglePanel: () => void;
  setPanelWidth: (width: number) => void;
}
