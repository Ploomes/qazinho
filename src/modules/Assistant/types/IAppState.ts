import type { IBuild } from '@/modules/Build/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IIntegrationStatus } from '@/shared/types';

/** QAzinho as the assistant's tools read it: the projects, the workspaces, the connected trackers, the builds, and the toolchains a build needs. */
export interface IAppState {
  projects: IProject[];
  workspaces: IWorkspace[];
  integrations: IIntegrationStatus[];
  builds: IBuild[];
  hasAndroidSdk: boolean;
  hasXcode: boolean;
}
