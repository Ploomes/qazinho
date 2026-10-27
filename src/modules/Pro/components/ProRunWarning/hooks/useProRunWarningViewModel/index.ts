import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProUpdate } from '@/modules/Pro/hooks/useProUpdate';
import { useRunActions } from '@/modules/Run/hooks/useRunActions';
import { useProStore, useWorkspaceStore } from '@/store';

export const useProRunWarningViewModel = () => {
  const { t } = useTranslation();
  const heldRun = useProStore((state) => state.heldRun);
  const shares = useProStore((state) => state.shares);
  const holdRun = useProStore((state) => state.holdRun);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const { update } = useProUpdate();
  const { runWorkspace } = useRunActions();
  const [isUpdating, setUpdating] = useState(false);
  const workspace = workspaces.find(({ id }) => id === heldRun?.workspaceId) ?? null;
  const conflict =
    shares
      .find(({ projectId }) => projectId === workspace?.projectId)
      ?.conflicts.find(({ workspaceId }) => workspaceId === workspace?.id) ?? null;
  const plan = workspace?.name ?? '';

  return {
    title: t('PRO.RUN_WARNING_TITLE'),
    text:
      conflict?.editedBy === null || conflict === null
        ? t('PRO.RUN_WARNING_TEXT_ANON', { plan })
        : t('PRO.RUN_WARNING_TEXT', { plan, who: conflict.editedBy }),
    confirmLabel: t('PRO.RUN_WARNING_UPDATE'),
    canConfirm: workspace !== null && !isUpdating,
    runLabel: t('PRO.RUN_WARNING_RUN'),
    onCancel: () => {
      holdRun(null);
    },
    onConfirm: () => {
      if (workspace === null || isUpdating) return;

      setUpdating(true);
      void update(workspace.projectId)
        .catch(() => undefined)
        .then(() => {
          setUpdating(false);
          holdRun(null);
        });
    },
    onRunAnyway: () => {
      holdRun(null);

      if (heldRun !== null) runWorkspace(heldRun.workspaceId, heldRun.mode);
    },
  };
};
