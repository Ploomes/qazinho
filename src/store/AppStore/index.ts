import type { IAppStore } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE } from '@/constants';

export const useAppStore = create<IAppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      screen: 'welcome',
      modal: null,
      projects: [],
      isLoaded: false,
      selectedWorkspaceId: null,
      selectedProjectId: null,
      isResourcesOpen: false,
      isModelMenuOpen: false,
      media: null,

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

      loadProjects: (projects) =>
        set({ projects, isLoaded: true, selectedProjectId: projects[0]?.id ?? null }),

      // The two popovers share the top-right corner, so opening one closes the other.
      toggleResources: () =>
        set((state) => ({
          isResourcesOpen: !state.isResourcesOpen,
          isModelMenuOpen: false,
        })),

      toggleModelMenu: () =>
        set((state) => ({
          isModelMenuOpen: !state.isModelMenuOpen,
          isResourcesOpen: false,
        })),

      openMedia: (media) => set({ media }),

      closeMedia: () => set({ media: null }),
    }),
    { name: STORAGE.appearance, partialize: ({ theme }) => ({ theme }) },
  ),
);
