import type { CaseChoice } from '@/modules/Pro/types';
import type { IProSyncCase } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProUpdate } from '@/modules/Pro/hooks/useProUpdate';
import { planUpdatesOf } from '@/modules/Pro/library';
import { useRunActions } from '@/modules/Run/hooks/useRunActions';
import { useProStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const useProMergeModalViewModel = () => {
  const { t } = useTranslation();
  const projectId = useProStore((state) => state.merging);
  const shares = useProStore((state) => state.shares);
  const openMerge = useProStore((state) => state.openMerge);
  const holdRun = useProStore((state) => state.holdRun);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const language = useSettingsStore((state) => state.language);
  const { takeChosen } = useProUpdate();
  const { runWorkspace } = useRunActions();
  const [choices, setChoices] = useState<Record<string, Record<string, CaseChoice>>>({});
  const [isTaking, setTaking] = useState(false);
  const share = shares.find((one) => one.projectId === projectId);
  const updates = planUpdatesOf({ share, workspaces, choices }).filter(
    ({ clashes, isBusy }) => clashes.length > 0 && !isBusy,
  );
  const whenOf = (iso: string) =>
    new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
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
    other: IProSyncCase | null;
  }) => {
    const { workspaceId, caseId, choice, testCase, other } = props;
    const isChosen = (choices[workspaceId]?.[caseId] ?? 'mine') === choice;
    const goal = testCase?.goal ?? '';
    const preconditions = testCase?.preconditions ?? '';
    const differs = (here: string | undefined, there: string | undefined) =>
      testCase !== null && other !== null && here !== there;

    return {
      key: choice,
      label: choice === 'mine' ? t('PRO.MERGE_MINE') : t('PRO.MERGE_THEIRS'),
      caseId,
      isDeleted: testCase === null,
      deleted: t('PRO.MERGE_DELETED'),
      title: testCase?.title ?? '',
      isTitleChanged: differs(testCase?.title, other?.title),
      hasGoal: goal !== '',
      goal,
      isGoalChanged: differs(goal, other?.goal),
      hasPreconditions: preconditions !== '',
      preconditionsLabel: t('PRO.MERGE_PRECONDITIONS'),
      preconditions,
      isPreconditionsChanged: differs(preconditions, other?.preconditions),
      expectLabel: t('PRO.MERGE_EXPECT'),
      steps: (testCase?.steps ?? []).map((step, index) => ({
        key: String(index),
        number: String(index + 1),
        action: step.action,
        isActionChanged: differs(step.action, other?.steps[index]?.action),
        expected: step.expected,
        isExpectedChanged: differs(step.expected, other?.steps[index]?.expected),
      })),
      isChosen,
      className: isChosen ? 'pro-merge__side pro-merge__side--chosen' : 'pro-merge__side',
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
      name: update.workspace.name,
      byline:
        update.conflict.editedBy === null
          ? t('PRO.MERGE_BY_ANON', { when: whenOf(update.conflict.editedAt) })
          : t('PRO.MERGE_BY', {
              who: update.conflict.editedBy,
              when: whenOf(update.conflict.editedAt),
            }),
      clashes: update.clashes.map((clash) => ({
        key: clash.id,
        sides: [
          sideOf({
            workspaceId: update.workspace.id,
            caseId: clash.id,
            choice: 'mine',
            testCase: clash.mine,
            other: clash.theirs,
          }),
          sideOf({
            workspaceId: update.workspace.id,
            caseId: clash.id,
            choice: 'theirs',
            testCase: clash.theirs,
            other: clash.mine,
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
      void takeChosen({ projectId, choices }).then(
        () => {
          const { heldRun } = useProStore.getState();
          const held = workspaces.find(({ id }) => id === heldRun?.workspaceId);

          if (heldRun === null || held?.projectId !== projectId) return;

          holdRun(null);
          runWorkspace(heldRun.workspaceId, heldRun.mode);
        },
        () => {
          setTaking(false);
        },
      );
    },
  };
};
