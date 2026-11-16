import type { IAppStore } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { withoutPlanMemories } from '@/modules/Memory/library';
import { HOME, STORAGE } from '@/shared/constants';
import { shownThemeOf, withNameSettled } from './library';

export const useAppStore = create<IAppStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      systemTheme: 'dark',
      screen: 'welcome',
      modal: null,
      projects: [],
      isLoaded: false,
      editingProjectId: null,
      projectSection: null,
      selectedWorkspaceId: null,
      recent: [],
      selectedProjectId: null,
      pendingImport: null,
      pendingCommand: null,
      isResourcesOpen: false,
      isSearchOpen: false,
      modelMenuAt: null,
      media: null,
      replay: null,
      dock: null,

      toggleTheme: () =>
        set((state) => ({ theme: shownThemeOf(state) === 'dark' ? 'light' : 'dark' })),

      setTheme: (theme) => set({ theme }),
      setDock: (dock) => set({ dock }),

      setSystemTheme: (systemTheme) => set({ systemTheme }),

      openSettings: () => set({ screen: 'settings' }),

      closeSettings: () =>
        set((state) => ({
          screen: state.selectedWorkspaceId === null ? 'welcome' : 'workspace',
        })),

      openNewProject: () => set({ screen: 'newProject', modal: null }),

      closeNewProject: () =>
        set((state) => ({
          screen: state.selectedWorkspaceId === null ? 'welcome' : 'workspace',
        })),

      openModal: (modal) => set({ modal, editingProjectId: null, projectSection: null }),

      openProjectSettings: (projectId) =>
        set({ modal: 'project', editingProjectId: projectId, projectSection: null }),

      openProSettings: (projectId) =>
        set({ modal: 'project', editingProjectId: projectId, projectSection: 'pro' }),

      openProjectSection: ({ projectId, section }) =>
        set({ modal: 'project', editingProjectId: projectId, projectSection: section }),

      openWorkspaceModal: (projectId) =>
        set({ modal: 'workspace', selectedProjectId: projectId }),

      closeModal: () =>
        set({ modal: null, editingProjectId: null, projectSection: null }),

      selectWorkspace: (workspaceId) =>
        set((state) => ({
          screen: 'workspace',
          selectedWorkspaceId: workspaceId,
          recent: [
            { workspaceId, at: Date.now() },
            ...state.recent.filter((one) => one.workspaceId !== workspaceId),
          ].slice(0, HOME.recentKept),
        })),

      goHome: () => set({ screen: 'welcome', selectedWorkspaceId: null }),

      openBugs: () => set({ screen: 'bugs', selectedWorkspaceId: null }),

      openUsage: () => set({ screen: 'usage', selectedWorkspaceId: null }),

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
            ? state.projects.map((one) =>
                one.id === project.id
                  ? withNameSettled({ before: one, after: project })
                  : one,
              )
            : [...state.projects, project],
          selectedProjectId: state.selectedProjectId ?? project.id,
        })),

      nameProject: ({ projectId, name }) => {
        const project = get().projects.find(({ id }) => id === projectId);

        if (project?.isNamePending !== true || name.trim() === '') return false;

        const { isNamePending: _pending, ...named } = project;

        set((state) => ({
          projects: state.projects.map((one) =>
            one.id === projectId ? { ...named, name: name.trim() } : one,
          ),
        }));

        return true;
      },

      forgetPlanMemories: (workspaceId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            const memories = withoutPlanMemories({
              memories: project.memories ?? [],
              workspaceId,
              now: new Date().toISOString(),
            });

            return memories === (project.memories ?? []) || project.memories === undefined
              ? project
              : { ...project, memories };
          }),
        })),

      updateProject: (project) =>
        set((state) => ({
          projects: state.projects.map((one) =>
            one.id === project.id
              ? withNameSettled({ before: one, after: project })
              : one,
          ),
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

      openSearch: () =>
        set({ isSearchOpen: true, isResourcesOpen: false, modelMenuAt: null }),

      closeSearch: () => set({ isSearchOpen: false }),

      toggleModelMenu: (at) =>
        set((state) => ({
          modelMenuAt: state.modelMenuAt === at ? null : at,
          isResourcesOpen: false,
        })),

      closeModelMenu: () => set({ modelMenuAt: null }),

      requestImport: (pendingImport) => set({ pendingImport }),

      clearImport: () => set({ pendingImport: null }),

      requestCommand: (pendingCommand) => set({ pendingCommand }),

      clearCommand: () => set({ pendingCommand: null }),

      openMedia: (media) => set({ media }),

      closeMedia: () => set({ media: null }),

      openReplay: (replay) => set({ replay }),

      closeReplay: () => set({ replay: null }),
    }),
    {
      name: STORAGE.appearance,
      partialize: ({ theme, recent }) => ({ theme, recent }),
    },
  ),
);
