import type { ProStatus } from '@/shared/types';
import { useEffect } from 'react';
import { PRO_ORG_PROJECTS, PRO_PUSH } from '@/modules/Pro/constants';
import { changedProjectsOf, proBatchOf } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { lastWritten, saveLater } from '@/shared/hooks/useArchive/library';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

export const useProSync = () => {
  const setStatus = useProStore((state) => state.setStatus);
  const setShares = useProStore((state) => state.setShares);
  const landShare = useProStore((state) => state.landShare);
  const setOrgProjects = useProStore((state) => state.setOrgProjects);
  const orgSlug = useProStore((state) =>
    state.status?.isSignedIn === true ? state.status.orgSlug : null,
  );

  useEffect(() => {
    void Pro.status().then(setStatus);
    void Pro.shares().then(setShares);

    return Pro.onSync(landShare);
  }, [setStatus, setShares, landShare]);

  useEffect(() => {
    if (orgSlug === null) {
      setOrgProjects([]);

      return;
    }

    const read = () => {
      void Pro.orgProjects(orgSlug).then((listed) => {
        if (listed.isListed) setOrgProjects(listed.projects);
      });
    };
    const timer = window.setInterval(read, PRO_ORG_PROJECTS.refreshMs);

    read();

    return () => {
      window.clearInterval(timer);
    };
  }, [orgSlug, setOrgProjects]);

  useEffect(() => {
    const sent = lastWritten();
    const later = saveLater(PRO_PUSH.settleMs);

    const push = (projectIds: string[]) => {
      const { status } = useProStore.getState();
      const { workspaces, isLoaded } = useWorkspaceStore.getState();
      const { projects } = useAppStore.getState();

      if (status?.isSignedIn !== true || status.orgSlug === null || !isLoaded) return;

      for (const project of projects) {
        if (!projectIds.includes(project.id)) continue;

        const batch = proBatchOf({ project, workspaces });
        const json = JSON.stringify(batch);
        const key = `${status.machine.id}/${status.orgSlug}/${project.id}`;

        if (!sent.isNew(key, json)) continue;

        sent.keep(key, json);
        later.save(project.id, () => {
          void Pro.sync(batch);
        });
      }
    };

    const pushEvery = () => {
      push(useAppStore.getState().projects.map(({ id }) => id));
    };

    const targetOf = (status: ProStatus | null) =>
      status?.isSignedIn === true ? `${status.machine.id}/${status.orgSlug ?? ''}` : '';

    const stops = [
      useWorkspaceStore.subscribe((state, before) => {
        if (state.isLoaded && !before.isLoaded) {
          pushEvery();

          return;
        }

        if (state.workspaces !== before.workspaces)
          push(
            changedProjectsOf({
              workspaces: state.workspaces,
              before: before.workspaces,
            }),
          );
      }),
      useAppStore.subscribe((state, before) => {
        if (state.projects === before.projects) return;

        push(
          state.projects
            .filter((project) => !before.projects.includes(project))
            .map(({ id }) => id),
        );
      }),
      useProStore.subscribe((state, before) => {
        if (targetOf(state.status) !== targetOf(before.status)) pushEvery();
      }),
    ];

    pushEvery();

    return () => {
      later.flush();

      for (const stop of stops) stop();
    };
  }, []);
};
