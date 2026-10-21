import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IIntegrationStatus } from '@/shared/types';

/** QAzinho as the assistant's tools read it: the projects, the workspaces and the connected trackers. */
export interface IAppState {
  projects: IProject[];
  workspaces: IWorkspace[];
  integrations: IIntegrationStatus[];
}
