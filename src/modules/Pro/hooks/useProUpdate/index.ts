import type { CaseChoice, IPlanUpdate } from '@/modules/Pro/types';
import { planUpdatesOf, testCasesOf } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { useProStore, useWorkspaceStore } from '@/store';

export const useProUpdate = () => {
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const landShare = useProStore((state) => state.landShare);
  const openMerge = useProStore((state) => state.openMerge);

  const updatesOf = (props: {
    projectId: string;
    choices?: Record<string, Record<string, CaseChoice>>;
  }) =>
    planUpdatesOf({
      share: useProStore
        .getState()
        .shares.find(({ projectId }) => projectId === props.projectId),
      workspaces: useWorkspaceStore.getState().workspaces,
      choices: props.choices,
    }).filter(({ isBusy }) => !isBusy);

  const take = async (update: IPlanUpdate) => {
    landShare(
      await Pro.resolve({
        projectId: update.workspace.projectId,
        workspaceId: update.workspace.id,
        version: update.conflict.version,
      }),
    );
    setPlan({
      workspaceId: update.workspace.id,
      plan: testCasesOf({ cases: update.cases, local: update.workspace.plan }),
    });
  };

  return {
    update: async (projectId: string) => {
      const updates = updatesOf({ projectId });

      for (const update of updates) if (update.clashes.length === 0) await take(update);

      if (updates.some(({ clashes }) => clashes.length > 0)) openMerge(projectId);
    },
    takeChosen: async (props: {
      projectId: string;
      choices: Record<string, Record<string, CaseChoice>>;
    }) => {
      for (const update of updatesOf(props)) await take(update);

      openMerge(null);
    },
  };
};
