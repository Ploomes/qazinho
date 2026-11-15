import type { IManualStep } from '@/modules/Device/components/DeviceView/components/ManualPanel/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MANUAL_PREP_KEYS } from '@/modules/Device/constants';
import { Run } from '@/services';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useVariablesStore } from '@/store';

export const useManualPanelViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    projectId: opened.projectId,
    plan: opened.plan,
    turn: opened.live?.isDone === false ? (opened.live.manual ?? null) : null,
    outcomes: opened.live?.outcomes ?? null,
  }));
  const variables =
    useVariablesStore((state) => state.byProject[workspace?.projectId ?? '']) ?? [];
  const [note, setNote] = useState('');
  const [isPicking, setPicking] = useState(false);
  const [marking, setMarking] = useState<number | null>(null);
  const turn = workspace?.turn ?? null;
  const testCase = workspace?.plan.find(({ id }) => id === turn?.caseId) ?? null;
  const marked = new Map(
    (workspace?.outcomes ?? [])
      .filter(({ caseId }) => caseId === turn?.caseId)
      .map((outcome) => [outcome.stepNumber, outcome.verdict]),
  );
  const walkable = (testCase?.steps ?? [])
    .map((step, index) => ({ ...step, number: index + 1 }))
    .filter(({ action }) => action.trim().length > 0);
  const now = walkable.find(({ number }) => !marked.has(number)) ?? null;
  const steps: IManualStep[] = walkable.map((step) => ({
    key: `${turn?.caseId ?? ''}-${String(step.number)}`,
    number: step.number,
    action: step.action,
    expected: step.expected,
    status:
      marked.get(step.number) ?? (step.number === now?.number ? 'running' : 'pending'),
    isNow: step.number === now?.number,
  }));
  const workspaceId = workspace?.id ?? null;
  const isMarking = marking !== null && marking === now?.number;

  const mark = (verdict: 'passed' | 'failed' | 'skipped') => {
    if (workspaceId === null || now === null || isMarking) return;

    setMarking(now.number);
    Run.mark({ workspaceId, verdict, note });
    setNote('');
  };

  return {
    title: t('DEVICE.MANUAL_TITLE', { id: turn?.caseId ?? '' }),
    hint: t('DEVICE.MANUAL_HINT'),
    prep:
      turn === null || turn.prep === 'none' || testCase === null
        ? null
        : t(MANUAL_PREP_KEYS[turn.prep], { what: testCase.preconditions.trim() }),
    steps,
    expectedPrefix: t('PLAN.EXPECTED_PREFIX'),
    note,
    notePlaceholder: t('DEVICE.MANUAL_NOTE'),
    canMark: now !== null && !isMarking,
    passedLabel: t('DEVICE.MANUAL_PASSED'),
    failedLabel: t('DEVICE.MANUAL_FAILED'),
    skipLabel: t('DEVICE.MANUAL_SKIP'),
    hasVariables: variables.length > 0,
    variableLabel: t('DEVICE.MANUAL_VARIABLE'),
    isPicking,
    variables: variables.map(({ name }) => ({
      name: `\${${name}}`,
      onPick: () => {
        setPicking(false);

        if (workspaceId !== null) void Run.typeVariable({ workspaceId, name });
      },
    })),
    endLabel: t('DEVICE.MANUAL_END'),
    onNote: (value: string) => {
      setNote(value);
    },
    onPassed: () => {
      mark('passed');
    },
    onFailed: () => {
      mark('failed');
    },
    onSkip: () => {
      mark('skipped');
    },
    onPickVariable: () => {
      setPicking((open) => !open);
    },
    onEnd: () => {
      if (workspaceId !== null) Run.endManual(workspaceId);
    },
  };
};
