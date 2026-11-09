import type { ProStatus } from '@/shared/types';
import { useEffect } from 'react';
import { mergedMemoriesOf } from '@/modules/Memory/library';
import { PRO_PUSH } from '@/modules/Pro/constants';
import { changedProjectsOf, isSendingShare, proBatchOf } from '@/modules/Pro/library';
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

    return Pro.onSync(({ memories, ...share }) => {
      landShare(share);

      if (memories === undefined) return;

      const { projects, updateProject } = useAppStore.getState();
      const project = projects.find(({ id }) => id === share.projectId);

      if (project === undefined) return;

      const merged = mergedMemoriesOf({
        local: project.memories ?? [],
        org: memories,
        now: new Date().toISOString(),
      });

      if (JSON.stringify(merged) !== JSON.stringify(project.memories ?? []))
        updateProject({ ...project, memories: merged });
    });
  }, [setStatus, setShares, landShare]);

  useEffect(() => {
    const sent = lastWritten();
    const later = saveLater(PRO_PUSH.settleMs);

    const push = (projectIds: string[]) => {
      const { status, shares } = useProStore.getState();
      const { workspaces, isLoaded } = useWorkspaceStore.getState();
      const { projects } = useAppStore.getState();

      if (status?.isSignedIn !== true || !isLoaded) return;

      for (const project of projects) {
        const share = shares.find(({ projectId }) => projectId === project.id);

        if (!projectIds.includes(project.id) || share === undefined) continue;
        if (!isSendingShare(share)) continue;

        const batch = proBatchOf({ project, workspaces });
        const json = JSON.stringify(batch);
        const key = `${status.machine.id}/${share.orgSlug ?? ''}/${project.id}`;

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

    const machineOf = (status: ProStatus | null) =>
      status?.isSignedIn === true ? status.machine.id : '';

    const linkedOf = (shares: { projectId: string; orgSlug: string | null }[]) =>
      shares.map(({ projectId, orgSlug }) => `${projectId}/${orgSlug ?? ''}`).join(',');

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
          machineOf(state.status) !== machineOf(before.status) ||
          linkedOf(state.shares) !== linkedOf(before.shares)
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
