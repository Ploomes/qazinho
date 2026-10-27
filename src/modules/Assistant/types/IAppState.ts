import type { IBuild } from '@/modules/Build/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IIntegrationStatus, IVariableBrief } from '@/shared/types';

/**
 * QAzinho as the assistant's tools read it: projects, workspaces, trackers, builds and
 * variables.
 */
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
