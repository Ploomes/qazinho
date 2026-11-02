import type { IMedia } from './IMedia';
import type { Modal } from './Modal';
import type { ModelMenuAt } from './ModelMenuAt';
import type { Screen } from './Screen';
import type { Theme } from './Theme';
import type { IProject } from '@/modules/Project';
import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';
import type { IReplayOpen, IRunNotice } from '@/modules/Run';
import type { IImportSource } from '@/shared/types';

/**
 * O shell: qual tela está em cima, qual projeto está escolhido, e o que flutua sobre ela.
 */
export interface IAppStore {
  theme: Theme;
  screen: Screen;
  modal: Modal | null;
  projects: IProject[];
  isLoaded: boolean;
  editingProjectId: string | null;
  projectSection: ProjectSection | null;
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  pendingImport: { workspaceId: string; source: IImportSource } | null;
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
  openProSettings: (projectId: string) => void;
  openProjectSection: (props: { projectId: string; section: ProjectSection }) => void;
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
  requestImport: (props: { workspaceId: string; source: IImportSource }) => void;
  clearImport: () => void;
  openMedia: (media: IMedia) => void;
  closeMedia: () => void;
  openReplay: (replay: IReplayOpen) => void;
  closeReplay: () => void;
  showRunNotice: (notice: IRunNotice) => void;
  closeRunNotice: () => void;
}
