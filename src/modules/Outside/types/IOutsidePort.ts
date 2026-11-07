import type { IToolDone } from '@/modules/Assistant/types';
import type { ITestCase } from '@/modules/Plan';
import type { IProject } from '@/modules/Project';
import type { IWorkspace } from '@/modules/Workspace';
import type {
  AppToolCall,
  IIntegrationStatus,
  IVariableBrief,
  IDraftedCase,
  INetworkEntry,
  IRunRef,
  RunMode,
  TargetKind,
} from '@/shared/types';

/** O que as ferramentas de um agente de fora fazem no QAzinho, pelos caminhos do QA. */
export interface IOutsidePort {
  read: () => {
    isLoaded: boolean;
    projects: IProject[];
    workspaces: IWorkspace[];
    askingIds: string[];
    variables: Record<string, IVariableBrief[]>;
    settings: {
      theme: 'dark' | 'light';
      language: string;
      runAlert: 'system' | 'app';
      agent: string;
      integrations: IIntegrationStatus[];
    };
  };
  now: () => number;
  targetLabel: (kind: TargetKind) => string;
  putProject: (project: IProject) => void;
  addWorkspace: (workspace: IWorkspace) => void;
  startRun: (props: {
    workspaceId: string;
    mode: RunMode;
    caseIds?: string[];
  }) => string | null;
  stopWorkspace: (workspaceId: string) => void;
  waitForRun: (props: { workspaceId: string; ms: number }) => Promise<void>;
  networkOf: (run: IRunRef) => Promise<INetworkEntry[] | null>;
  askChat: (props: { workspaceId: string; text: string }) => void;
  waitForChat: (props: { workspaceId: string; ms: number }) => Promise<void>;
  perform: (call: AppToolCall) => Promise<IToolDone>;
  changePlan: (props: { workspaceId: string; plan: ITestCase[] }) => void;
  suggestCases: (props: {
    workspaceId: string;
    summary: string;
    cases: IDraftedCase[];
  }) => void;
}
