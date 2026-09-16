import type { IAppStore } from './types';
import { create } from 'zustand';

export const useAppStore = create<IAppStore>((set) => ({
  theme: 'dark',
  screen: 'welcome',
  modal: null,
  projects: [],
  selectedWorkspaceId: null,
  selectedProjectId: null,
  isResourcesOpen: false,
  isModelMenuOpen: false,

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  openSettings: () => set({ screen: 'settings' }),

  openModal: (modal) => set({ modal }),

  openWorkspaceModal: (projectId) =>
    set({ modal: 'workspace', selectedProjectId: projectId }),

  closeModal: () => set({ modal: null }),

  selectWorkspace: (workspaceId) =>
    set({ screen: 'workspace', selectedWorkspaceId: workspaceId }),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
      selectedProjectId: project.id,
      modal: null,
    })),

  // The two popovers share the top-right corner, so opening one closes the other.
  toggleResources: () =>
    set((state) => ({ isResourcesOpen: !state.isResourcesOpen, isModelMenuOpen: false })),

  toggleModelMenu: () =>
    set((state) => ({ isModelMenuOpen: !state.isModelMenuOpen, isResourcesOpen: false })),
}));
