import { useEffect } from 'react';
import { PRO_PUSH } from '@/modules/Pro/constants';
import { changedProjectsOf, proBatchOf } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { lastWritten, saveLater } from '@/shared/hooks/useArchive/library';
import { useAppStore, useProStore, useWorkspaceStore } from '@/store';

export const useProSync = () => {
  const setStatus = useProStore((state) => state.setStatus);
  const setShares = useProStore((state) => state.setShares);
  const landShare = useProStore((state) => state.landShare);

  useEffect(() => {
    void Pro.status().then(setStatus);
    void Pro.shares().then(setShares);

    return Pro.onSync(landShare);
  }, [setStatus, setShares, landShare]);

  useEffect(() => {
    const sent = lastWritten();
    const later = saveLater(PRO_PUSH.settleMs);

    const push = (projectIds: string[]) => {
      const { status, shares } = useProStore.getState();
      const { workspaces, isLoaded } = useWorkspaceStore.getState();
      const { projects } = useAppStore.getState();

      if (status?.isSignedIn !== true || !isLoaded) return;

      for (const share of shares) {
        const project = projects.find(({ id }) => id === share.projectId);

        if (share.orgSlug === null || !project || !projectIds.includes(project.id))
          continue;

        const batch = proBatchOf({ project, workspaces });
        const json = JSON.stringify(batch);
        const key = `${status.machine.id}/${share.orgSlug}/${project.id}`;

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

    const shareKeyOf = (shares: { projectId: string; orgSlug: string | null }[]) =>
      shares.map(({ projectId, orgSlug }) => `${projectId}:${orgSlug ?? ''}`).join(',');

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
        if (
          state.status !== before.status ||
          shareKeyOf(state.shares) !== shareKeyOf(before.shares)
        )
          pushEvery();
      }),
    ];

    pushEvery();

    return () => {
      later.flush();

      for (const stop of stops) stop();
    };
  }, []);
};
