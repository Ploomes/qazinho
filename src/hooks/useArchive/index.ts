import type { IProject } from '@/modules/Project/types';
import { useEffect, useRef } from 'react';
import { readProjects } from '@/modules/Project/library';
import { fromSaved, toSaved } from '@/modules/Workspace/library';
import { Archive } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';
import { ARCHIVE } from './constants';
import { lastWritten, saveLater } from './library';

const PROJECTS = 'projects';

function asJson(projects: IProject[]): string {
  return JSON.stringify(projects, null, 2);
}

/** gocrash remembers: what the QA made is read back on start and written as it changes. */
export const useArchive = () => {
  const loadProjects = useAppStore((state) => state.loadProjects);
  const loadWorkspaces = useWorkspaceStore((state) => state.loadWorkspaces);
  const onDisk = useRef(lastWritten());

  useEffect(() => {
    const held = onDisk.current;

    void Archive.read().then((saved) => {
      const projects = readProjects(saved.projects);
      const workspaces = saved.workspaces
        .map(fromSaved)
        .filter((workspace) => workspace !== null)
        .sort((first, second) => first.name.localeCompare(second.name));

      held.keep(PROJECTS, asJson(projects));

      for (const workspace of workspaces)
        held.keep(workspace.id, JSON.stringify(toSaved(workspace)));

      loadProjects(projects);
      loadWorkspaces(workspaces);
    });
  }, [loadProjects, loadWorkspaces]);

  useEffect(() => {
    const held = onDisk.current;

    return useAppStore.subscribe((state, before) => {
      if (!before.isLoaded || state.projects === before.projects) return;

      const json = asJson(state.projects);

      if (!held.isNew(PROJECTS, json)) return;

      held.keep(PROJECTS, json);
      Archive.saveProjects(json);
    });
  }, []);

  useEffect(() => {
    const held = onDisk.current;
    const later = saveLater(ARCHIVE.settleMs);

    const stop = useWorkspaceStore.subscribe((state, before) => {
      if (!before.isLoaded || state.workspaces === before.workspaces) return;

      for (const gone of before.workspaces)
        if (!state.workspaces.some(({ id }) => id === gone.id)) held.forget(gone.id);

      for (const workspace of state.workspaces) {
        if (workspace === before.workspaces.find(({ id }) => id === workspace.id))
          continue;

        const saved = toSaved(workspace);

        if (!held.isNew(workspace.id, JSON.stringify(saved))) continue;

        held.keep(workspace.id, JSON.stringify(saved));
        later.save(workspace.id, () => {
          Archive.saveWorkspace(saved);
        });
      }
    });

    return () => {
      later.flush();
      stop();
    };
  }, []);
};
