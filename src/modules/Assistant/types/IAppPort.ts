import type { ConfirmAction } from './ConfirmAction';
import type { ConfirmDecision } from './ConfirmDecision';
import type { IAppState } from './IAppState';
import type { IProject } from '@/modules/Project/types';
import type { RunAlert, SettingsTab } from '@/modules/Settings/types';
import type { IWorkspace, WorkspaceTab } from '@/modules/Workspace/types';
import type {
  BugFiling,
  BuildPlatform,
  IBranchList,
  IConfluencePageRef,
  IDesignLink,
  IJiraIssueRef,
  IntegrationId,
  IRepositoryList,
  IRepositoryRef,
  IssueTarget,
  IVariableBrief,
  JiraFailure,
  Language,
  TargetKind,
  VariableChange,
  VariablesOutcome,
} from '@/shared/types';
import type { Theme } from '@/store/AppStore/types';

/**
 * Tudo o que as ferramentas do assistente fazem no QAzinho, do jeito que os próprios
 * cliques do QA fazem.
 */
export interface IAppPort {
  read: () => IAppState;
  now: () => number;
  targetLabel: (kind: TargetKind) => string;
  themeName: (theme: Theme) => string;
  openWorkspace: (props: {
    workspaceId: string;
    tab: WorkspaceTab;
    runId: string | null;
    bugId: string | null;
  }) => void;
  openProject: (projectId: string) => void;
  openSettings: (section: SettingsTab | null) => void;
  goHome: () => void;
  putProject: (project: IProject) => void;
  removeProject: (projectId: string) => void;
  addWorkspace: (workspace: IWorkspace) => void;
  renameWorkspace: (props: { workspaceId: string; name: string }) => void;
  dismissBug: (props: {
    workspaceId: string;
    bugId: string;
    isDismissed: boolean;
  }) => void;
  setDesign: (props: { workspaceId: string; design: IDesignLink | null }) => void;
  removeWorkspace: (workspaceId: string) => void;
  runWorkspace: (workspaceId: string) => string | null;
  exploreWorkspace: (workspaceId: string) => string | null;
  stopWorkspace: (workspaceId: string) => void;
  askWorkspaceChat: (props: {
    workspaceId: string;
    text: string;
    story: IJiraIssueRef | null;
    page: IConfluencePageRef | null;
    design: IDesignLink | null;
  }) => void;
  findStory: (key: string) => Promise<IJiraIssueRef | JiraFailure>;
  findPage: (query: string) => Promise<IConfluencePageRef | JiraFailure>;
  sendBug: (props: {
    workspaceId: string;
    bugId: string;
    target: IssueTarget;
  }) => Promise<BugFiling>;
  changeSettings: (props: {
    theme?: Theme;
    language?: Language;
    runAlert?: RunAlert;
  }) => void;
  connectIntegration: (id: IntegrationId) => void;
  disconnectIntegration: (id: IntegrationId) => Promise<void>;
  listRepositories: () => Promise<IRepositoryList>;
  listBranches: (repository: IRepositoryRef) => Promise<IBranchList>;
  startBuild: (props: {
    projectId: string;
    platform: BuildPlatform;
    repository: IRepositoryRef;
    branch: string;
  }) => string;
  askVariables: (props: {
    projectId: string;
    drafts: IVariableBrief[];
  }) => Promise<string[] | null>;
  applyVariables: (props: {
    projectId: string;
    changes: VariableChange[];
  }) => Promise<VariablesOutcome>;
  confirm: (props: {
    id: string;
    action: ConfirmAction;
    subject: string;
    count: number;
    detail?: string;
    from?: 'outside';
  }) => Promise<ConfirmDecision>;
}
