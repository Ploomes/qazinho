import type { IAppStore } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE } from '@/shared/constants';

export const useAppStore = create<IAppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      screen: 'welcome',
      modal: null,
      projects: [],
      isLoaded: false,
      editingProjectId: null,
      selectedWorkspaceId: null,
      selectedProjectId: null,
      isResourcesOpen: false,
      modelMenuAt: null,
      media: null,
      replay: null,

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setTheme: (theme) => set({ theme }),

      openSettings: () => set({ screen: 'settings' }),

      closeSettings: () =>
        set((state) => ({
          screen: state.selectedWorkspaceId === null ? 'welcome' : 'workspace',
        })),

      openModal: (modal) => set({ modal, editingProjectId: null }),

      openProjectSettings: (projectId) =>
        set({ modal: 'project', editingProjectId: projectId }),

      openWorkspaceModal: (projectId) =>
        set({ modal: 'workspace', selectedProjectId: projectId }),

      closeModal: () => set({ modal: null, editingProjectId: null }),

      selectWorkspace: (workspaceId) =>
        set({ screen: 'workspace', selectedWorkspaceId: workspaceId }),

      goHome: () => set({ screen: 'welcome', selectedWorkspaceId: null }),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
          selectedProjectId: project.id,
          modal: 'workspace',
        })),

      loadProjects: (projects) =>
        set({ projects, isLoaded: true, selectedProjectId: projects[0]?.id ?? null }),

      updateProject: (project) =>
        set((state) => ({
          projects: state.projects.map((one) => (one.id === project.id ? project : one)),
          modal: null,
          editingProjectId: null,
        })),

      removeProject: ({ projectId, isOpen }) =>
        set((state) => {
          const projects = state.projects.filter(({ id }) => id !== projectId);

          return {
            projects,
            modal: null,
            editingProjectId: null,
            ...(isOpen ? { screen: 'welcome' as const, selectedWorkspaceId: null } : {}),
            selectedProjectId:
              state.selectedProjectId === projectId
                ? (projects[0]?.id ?? null)
                : state.selectedProjectId,
          };
        }),

      toggleResources: () =>
        set((state) => ({
          isResourcesOpen: !state.isResourcesOpen,
          modelMenuAt: null,
        })),

      toggleModelMenu: (at) =>
        set((state) => ({
          modelMenuAt: state.modelMenuAt === at ? null : at,
          isResourcesOpen: false,
        })),

      closeModelMenu: () => set({ modelMenuAt: null }),

      openMedia: (media) => set({ media }),

      closeMedia: () => set({ media: null }),

      openReplay: (replay) => set({ replay }),

      closeReplay: () => set({ replay: null }),
    }),
    {
      name: STORAGE.appearance,
      partialize: ({ theme }) => ({ theme }),
    },
  ),
);
