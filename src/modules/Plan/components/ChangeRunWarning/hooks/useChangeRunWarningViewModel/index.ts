import { useTranslation } from 'react-i18next';
import { useRunActions } from '@/modules/Run/hooks/useRunActions';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useChangeRunWarningViewModel = () => {
  const { t } = useTranslation();
  const hold = useWorkspaceStore((state) => state.changeHold);
  const holdForChanges = useWorkspaceStore((state) => state.holdForChanges);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const { beginRun } = useRunActions();
  const workspace = workspaces.find(({ id }) => id === hold?.workspaceId) ?? null;

  return {
    title: t('PLAN.RUN_CHANGED_TITLE'),
    text: t('PLAN.RUN_CHANGED_TEXT', { plan: workspace?.name ?? '' }),
    confirmLabel: t('PLAN.RUN_CHANGED_REVIEW'),
    canConfirm: workspace !== null,
    runLabel: t('PLAN.RUN_CHANGED_RUN'),
    onCancel: () => {
      holdForChanges(null);
    },
    onConfirm: () => {
      holdForChanges(null);

      if (workspace === null) return;

      selectWorkspace(workspace.id);
      selectTab('plan');
    },
    onRunAnyway: () => {
      holdForChanges(null);

      if (hold !== null)
        beginRun({
          workspaceId: hold.workspaceId,
          mode: hold.mode,
          ...(hold.caseIds === undefined ? {} : { caseIds: hold.caseIds }),
        });
    },
  };
};
