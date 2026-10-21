import type { ConfirmAction } from './ConfirmAction';
import type { ConfirmDecision } from './ConfirmDecision';
import type { IAppState } from './IAppState';
import type { IProject } from '@/modules/Project/types';
import type { RunAlert, SettingsTab } from '@/modules/Settings/types';
import type { IWorkspace, WorkspaceTab } from '@/modules/Workspace/types';
import type {
  BuildPlatform,
  IBranchList,
  IntegrationId,
  IRepositoryList,
  IRepositoryRef,
  Language,
  TargetKind,
} from '@/shared/types';
import type { Theme } from '@/store/AppStore/types';

/** Everything the assistant's tools do in QAzinho, the way the QA's own clicks do it. */
export interface IAppPort {
  read: () => IAppState;
  now: () => number;
  targetLabel: (kind: TargetKind) => string;
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
  removeWorkspace: (workspaceId: string) => void;
  runWorkspace: (workspaceId: string) => string | null;
  stopWorkspace: (workspaceId: string) => void;
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
  confirm: (props: {
    id: string;
    action: ConfirmAction;
    subject: string;
    count: number;
  }) => Promise<ConfirmDecision>;
}
