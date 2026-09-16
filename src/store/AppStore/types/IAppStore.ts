import type { Modal } from './Modal';
import type { Screen } from './Screen';
import type { Theme } from './Theme';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';

/** Everything the page renders from, plus the actions that move it. */
export interface IAppStore {
  theme: Theme;
  screen: Screen;
  modal: Modal | null;
  projects: IProject[];
  workspaces: IWorkspace[];
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  toggleTheme: () => void;
  openSettings: () => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
  selectWorkspace: (workspaceId: string) => void;
  addProject: (project: IProject) => void;
  addWorkspace: (workspace: IWorkspace) => void;
}
