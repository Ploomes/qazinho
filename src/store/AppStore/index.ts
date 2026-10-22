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
      projectSection: null,
      selectedWorkspaceId: null,
      selectedProjectId: null,
      automationProjectId: null,
      isResourcesOpen: false,
      modelMenuAt: null,
      media: null,
      replay: null,
      runNotice: null,

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setTheme: (theme) => set({ theme }),

      openSettings: () => set({ screen: 'settings' }),

      closeSettings: () =>
        set((state) => ({
          screen:
            state.automationProjectId !== null
              ? 'automation'
              : state.selectedWorkspaceId === null
                ? 'welcome'
                : 'workspace',
        })),

      openModal: (modal) => set({ modal, editingProjectId: null, projectSection: null }),

      openProjectSettings: (projectId) =>
        set({ modal: 'project', editingProjectId: projectId, projectSection: null }),

      openSuiteSettings: (projectId) =>
        set({
          modal: 'project',
          editingProjectId: projectId,
          projectSection: 'automation',
        }),

      openWorkspaceModal: (projectId) =>
        set({ modal: 'workspace', selectedProjectId: projectId }),

      closeModal: () =>
        set({ modal: null, editingProjectId: null, projectSection: null }),

      selectWorkspace: (workspaceId) =>
        set({
          screen: 'workspace',
          selectedWorkspaceId: workspaceId,
          automationProjectId: null,
        }),

      openAutomation: (projectId) =>
        set({ screen: 'automation', automationProjectId: projectId }),

      goHome: () =>
        set({ screen: 'welcome', selectedWorkspaceId: null, automationProjectId: null }),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
          selectedProjectId: project.id,
          modal: 'workspace',
        })),

      loadProjects: (projects) =>
        set({ projects, isLoaded: true, selectedProjectId: projects[0]?.id ?? null }),

      putProject: (project) =>
        set((state) => ({
          projects: state.projects.some(({ id }) => id === project.id)
            ? state.projects.map((one) => (one.id === project.id ? project : one))
            : [...state.projects, project],
          selectedProjectId: state.selectedProjectId ?? project.id,
        })),

      updateProject: (project) =>
        set((state) => ({
          projects: state.projects.map((one) => (one.id === project.id ? project : one)),
          modal: null,
          editingProjectId: null,
        })),

      removeProject: ({ projectId, isOpen }) =>
        set((state) => {
          const projects = state.projects.filter(({ id }) => id !== projectId);
          const isShown = isOpen || state.automationProjectId === projectId;

          return {
            projects,
            modal: null,
            editingProjectId: null,
            ...(isShown
              ? {
                  screen: 'welcome' as const,
                  selectedWorkspaceId: null,
                  automationProjectId: null,
                }
              : {}),
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

      showRunNotice: (runNotice) => set({ runNotice }),

      closeRunNotice: () => set({ runNotice: null }),
    }),
    {
      name: STORAGE.appearance,
      partialize: ({ theme }) => ({ theme }),
    },
  ),
);
