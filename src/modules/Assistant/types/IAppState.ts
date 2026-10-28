import type { IBuild } from '@/modules/Build/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IIntegrationStatus, IVariableBrief } from '@/shared/types';

/**
 * O QAzinho como as ferramentas do assistente o leem: projetos, workspaces, trackers,
 * builds e variáveis.
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
