import type { NewProjectStart } from './NewProjectStart';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';

/** Um projeto pronto para criar: os planos dele, o que abre e como cada um começa. */
export interface INewProject {
  project: IProject;
  workspaces: IWorkspace[];
  openId: string;
  starts: NewProjectStart[];
}
