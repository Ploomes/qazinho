import type { IMedia } from './IMedia';
import type { Modal } from './Modal';
import type { ModelMenuAt } from './ModelMenuAt';
import type { Screen } from './Screen';
import type { Theme } from './Theme';
import type { IProject } from '@/modules/Project';
import type { IReplayOpen, IRunNotice } from '@/modules/Run';

/** The shell: which screen is up, which project is selected, and what is floating over it. */
export interface IAppStore {
  theme: Theme;
  screen: Screen;
  modal: Modal | null;
  projects: IProject[];
  isLoaded: boolean;
  editingProjectId: string | null;
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  isResourcesOpen: boolean;
  modelMenuAt: ModelMenuAt | null;
  media: IMedia | null;
  replay: IReplayOpen | null;
  runNotice: IRunNotice | null;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  openSettings: () => void;
  closeSettings: () => void;
  openModal: (modal: Modal) => void;
  openProjectSettings: (projectId: string) => void;
  openWorkspaceModal: (projectId: string) => void;
  closeModal: () => void;
  selectWorkspace: (workspaceId: string) => void;
  goHome: () => void;
  addProject: (project: IProject) => void;
  loadProjects: (projects: IProject[]) => void;
  putProject: (project: IProject) => void;
  updateProject: (project: IProject) => void;
  removeProject: (props: { projectId: string; isOpen: boolean }) => void;
  toggleResources: () => void;
  toggleModelMenu: (at: ModelMenuAt) => void;
  closeModelMenu: () => void;
  openMedia: (media: IMedia) => void;
  closeMedia: () => void;
  openReplay: (replay: IReplayOpen) => void;
  closeReplay: () => void;
  showRunNotice: (notice: IRunNotice) => void;
  closeRunNotice: () => void;
}
