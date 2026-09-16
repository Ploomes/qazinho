import { useEffect } from 'react';
import { readProjects } from '@/modules/Project/library';
import { fromSaved, toSaved } from '@/modules/Workspace/library';
import { Archive } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';
import { ARCHIVE } from './constants';
import { saveLater } from './library';

/** gocrash remembers: what the QA made is read back on start and written as it changes. */
export const useArchive = () => {
  const loadProjects = useAppStore((state) => state.loadProjects);
  const loadWorkspaces = useWorkspaceStore((state) => state.loadWorkspaces);

  useEffect(() => {
    void Archive.read().then((saved) => {
      loadProjects(readProjects(saved.projects));
      loadWorkspaces(
        saved.workspaces
          .map(fromSaved)
          .filter((workspace) => workspace !== null)
          .sort((first, second) => first.name.localeCompare(second.name)),
      );
    });
  }, [loadProjects, loadWorkspaces]);

  useEffect(
    () =>
      useAppStore.subscribe((state, before) => {
        if (before.isLoaded && state.projects !== before.projects)
          Archive.saveProjects(JSON.stringify(state.projects, null, 2));
      }),
    [],
  );

  useEffect(() => {
    const later = saveLater(ARCHIVE.settleMs);

    const stop = useWorkspaceStore.subscribe((state, before) => {
      if (!before.isLoaded || state.workspaces === before.workspaces) return;

      for (const workspace of state.workspaces)
        if (workspace !== before.workspaces.find(({ id }) => id === workspace.id))
          later.save(workspace.id, () => {
            Archive.saveWorkspace(toSaved(workspace));
          });
    });

    return () => {
      later.flush();
      stop();
    };
  }, []);
};
