import type { CaseChoice } from '@/modules/Pro/types';
import type { IProSyncCase } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProUpdate } from '@/modules/Pro/hooks/useProUpdate';
import { planUpdatesOf } from '@/modules/Pro/library';
import { useProStore, useWorkspaceStore } from '@/store';

export const useProMergeModalViewModel = () => {
  const { t } = useTranslation();
  const projectId = useProStore((state) => state.merging);
  const shares = useProStore((state) => state.shares);
  const openMerge = useProStore((state) => state.openMerge);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const { takeChosen } = useProUpdate();
  const [choices, setChoices] = useState<Record<string, Record<string, CaseChoice>>>({});
  const [isTaking, setTaking] = useState(false);
  const share = shares.find((one) => one.projectId === projectId);
  const updates = planUpdatesOf({ share, workspaces, choices }).filter(
    ({ clashes, isBusy }) => clashes.length > 0 && !isBusy,
  );

  const choose = (props: { workspaceId: string; caseId: string; choice: CaseChoice }) => {
    setChoices((current) => ({
      ...current,
      [props.workspaceId]: {
        ...current[props.workspaceId],
        [props.caseId]: props.choice,
      },
    }));
  };

  const sideOf = (props: {
    workspaceId: string;
    caseId: string;
    choice: CaseChoice;
    testCase: IProSyncCase | null;
  }) => {
    const { workspaceId, caseId, choice, testCase } = props;
    const isChosen = (choices[workspaceId]?.[caseId] ?? 'mine') === choice;
    const preconditions = testCase?.preconditions ?? '';

    return {
      key: choice,
      label: choice === 'mine' ? t('PRO.MERGE_MINE') : t('PRO.MERGE_THEIRS'),
      isDeleted: testCase === null,
      deleted: t('PRO.MERGE_DELETED'),
      title: testCase?.title ?? '',
      goal: testCase?.goal ?? '',
      hasPreconditions: preconditions !== '',
      preconditions: t('PRO.MERGE_PRECONDITIONS', { text: preconditions }),
      steps: (testCase?.steps ?? []).map((step, index) => ({
        key: String(index),
        action: step.action,
        expected: step.expected,
      })),
      isChosen,
      className: isChosen ? 'pro-merge__side pro-merge__side--chosen' : 'pro-merge__side',
      keepLabel: t('PRO.MERGE_KEEP'),
      onKeep: () => {
        choose({ workspaceId, caseId, choice });
      },
    };
  };

  return {
    title: t('PRO.MERGE_TITLE'),
    subtitle: t('PRO.MERGE_SUBTITLE'),
    confirmLabel: t('PRO.MERGE_CONFIRM'),
    canConfirm: projectId !== null && !isTaking,
    plans: updates.map((update) => ({
      key: update.workspace.id,
      title:
        update.conflict.editedBy === null
          ? t('PRO.MERGE_PLAN_ANON', { plan: update.workspace.name })
          : t('PRO.MERGE_PLAN', {
              plan: update.workspace.name,
              who: update.conflict.editedBy,
            }),
      clashes: update.clashes.map((clash) => ({
        key: clash.id,
        sides: [
          sideOf({
            workspaceId: update.workspace.id,
            caseId: clash.id,
            choice: 'mine',
            testCase: clash.mine,
          }),
          sideOf({
            workspaceId: update.workspace.id,
            caseId: clash.id,
            choice: 'theirs',
            testCase: clash.theirs,
          }),
        ],
      })),
    })),
    onCancel: () => {
      openMerge(null);
    },
    onConfirm: () => {
      if (projectId === null || isTaking) return;

      setTaking(true);
      void takeChosen({ projectId, choices });
    },
  };
};
