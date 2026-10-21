import type { IBuild } from '@/modules/Build/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IIntegrationStatus, IVariableBrief } from '@/shared/types';

/** QAzinho as the assistant's tools read it: the projects, the workspaces and whose chat is answering, the connected trackers, the builds, the toolchains a build needs, and each project's variables by name. */
export interface IAppState {
  projects: IProject[];
  workspaces: IWorkspace[];
  askingIds: string[];
  integrations: IIntegrationStatus[];
  builds: IBuild[];
  hasAndroidSdk: boolean;
  hasXcode: boolean;
  variables: Record<string, IVariableBrief[]>;
}
