import type { IAppStore } from './types';
import { create } from 'zustand';

export const useAppStore = create<IAppStore>((set) => ({
  theme: 'dark',
  screen: 'welcome',
  modal: null,
  projects: [],
  workspaces: [],
  selectedWorkspaceId: null,
  selectedProjectId: null,

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  openSettings: () => set({ screen: 'settings' }),

  openModal: (modal) => set({ modal }),

  closeModal: () => set({ modal: null }),

  selectWorkspace: (workspaceId) =>
    set({ screen: 'workspace', selectedWorkspaceId: workspaceId }),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
      selectedProjectId: project.id,
      modal: null,
    })),

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
      screen: 'workspace',
      selectedWorkspaceId: workspace.id,
      modal: null,
    })),
}));
