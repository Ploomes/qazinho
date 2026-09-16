import type { IProject } from '@/modules/Project/types';
import type { Modal } from './Modal';
import type { Screen } from './Screen';
import type { Theme } from './Theme';

/** The shell: which screen is up, which project is selected, and what is floating over it. */
export interface IAppStore {
  theme: Theme;
  screen: Screen;
  modal: Modal | null;
  projects: IProject[];
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  isResourcesOpen: boolean;
  isModelMenuOpen: boolean;
  toggleTheme: () => void;
  openSettings: () => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
  selectWorkspace: (workspaceId: string) => void;
  addProject: (project: IProject) => void;
  toggleResources: () => void;
  toggleModelMenu: () => void;
}
