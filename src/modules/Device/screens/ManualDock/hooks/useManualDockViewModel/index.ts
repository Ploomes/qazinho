import type {
  DockPhase,
  IManualDockStep,
} from '@/modules/Device/screens/ManualDock/types';
import type { InternMood } from '@/shared/components/atoms/Intern/types';
import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { activityLineOf } from '@/modules/Chat/library';
import { useManualPanelViewModel } from '@/modules/Device/components/DeviceView/components/ManualPanel/hooks/useManualPanelViewModel';
import { formatElapsed } from '@/modules/Device/library';
import { MANUAL_DOCK } from '@/modules/Device/screens/ManualDock/constants';
import { useRunActions } from '@/modules/Run';
import { Platform } from '@/services';
import { comboLabelOf } from '@/shared/hooks/useKeybinds/library';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useManualDockViewModel = () => {
  const { t } = useTranslation();
  const manual = useManualPanelViewModel();
  const { stopWorkspace } = useRunActions();
  const opened = useSelectedWorkspacePart((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    projectId: workspace.projectId,
    plan: workspace.plan,
    hasDesign: workspace.design !== null,
    live: workspace.live,
  }));
  const projectName = useAppStore(
    (state) => state.projects.find(({ id }) => id === opened?.projectId)?.name ?? '',
  );
  const activities = useWorkspaceStore((state) =>
    opened === null ? undefined : state.activities[opened.id],
  );
  const isMac = Platform.isMac();
  const live = opened?.live ?? null;
  const turn =
    live !== null && !live.isDone && live.how === 'manual' ? (live.manual ?? null) : null;
  const caseId = turn?.caseId ?? live?.caseIds?.[0] ?? null;
  const testCase = opened?.plan.find(({ id }) => id === caseId) ?? null;
  const marked = new Map(
    (live?.outcomes ?? [])
      .filter((outcome) => outcome.caseId === caseId)
      .map((outcome) => [outcome.stepNumber, outcome.verdict]),
  );
  const walkable = (testCase?.steps ?? [])
    .map((step, index) => ({ ...step, number: index + 1 }))
    .filter(({ action }) => action.trim().length > 0);
  const isAllMarked =
    walkable.length > 0 && walkable.every(({ number }) => marked.has(number));
  const phase: DockPhase =
    live === null || live.isDone || isAllMarked
      ? 'done'
      : turn !== null
        ? 'turn'
        : 'preparing';
  const now =
    phase === 'turn'
      ? (walkable.find(({ number }) => !marked.has(number)) ?? null)
      : null;
  const steps: IManualDockStep[] = walkable.map((step) => {
    const isNow = step.number === now?.number;
    const status = marked.get(step.number) ?? (isNow ? 'running' : 'pending');

    return {
      key: `${caseId ?? ''}-${String(step.number)}`,
      number: step.number,
      action: step.action,
      expected: step.expected,
      status,
      isNow,
      className: isNow
        ? 'manual-dock__step manual-dock__step--now'
        : marked.has(step.number)
          ? 'manual-dock__step manual-dock__step--marked'
          : 'manual-dock__step',
    };
  });
  const verdicts = [...marked.values()];
  const count = (verdict: string) => verdicts.filter((one) => one === verdict).length;
  const passed = count('passed');
  const failed = count('failed');
  const skipped = count('skipped');
  const activity = activities?.find(({ tool }) => tool === 'say') ?? activities?.at(-1);
  const doing =
    (activity === undefined
      ? null
      : activityLineOf({
          activity,
          hasDesign: opened?.hasDesign ?? false,
          say: (key, values) => t(key, values),
        })?.text) ?? t('DOCK.PREPARING_NOTE');
  const isStopped = phase === 'done' && marked.size === 0;
  const isUnwalked = phase === 'done' && passed === 0 && failed === 0;
  const mood: InternMood =
    phase === 'preparing'
      ? 'running'
      : phase === 'turn'
        ? 'thinking'
        : isUnwalked
          ? 'neutral'
          : failed > 0
            ? 'bug'
            : 'passed';
  const summary = [
    passed === 0
      ? null
      : passed === 1
        ? t('DOCK.PASSED_ONE')
        : t('DOCK.PASSED_OTHER', { count: passed }),
    failed === 0
      ? null
      : failed === 1
        ? t('DOCK.FAILED_ONE')
        : t('DOCK.FAILED_OTHER', { count: failed }),
    skipped === 0
      ? null
      : skipped === 1
        ? t('DOCK.SKIPPED_ONE')
        : t('DOCK.SKIPPED_OTHER', { count: skipped }),
  ]
    .filter((part) => part !== null)
    .join(' · ');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== 'turn' || event.key !== 'Enter') return;
      if (!(isMac ? event.metaKey : event.ctrlKey)) return;

      event.preventDefault();

      if (event.shiftKey) manual.onFailed();
      else manual.onPassed();
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  return {
    barClassName: isMac ? 'manual-dock__bar manual-dock__bar--mac' : 'manual-dock__bar',
    projectName,
    planName: opened?.name === '' ? t('WORKSPACE.UNNAMED') : (opened?.name ?? ''),
    phase,
    isPreparing: phase === 'preparing',
    isTurn: phase === 'turn',
    isDone: phase === 'done',
    mood,
    internSize: MANUAL_DOCK.internSize,
    stateLabel:
      phase === 'preparing'
        ? t('DOCK.PREPARING')
        : phase === 'turn'
          ? t('DEVICE.YOUR_TURN')
          : isStopped
            ? t('DOCK.STOPPED')
            : isUnwalked
              ? t('DOCK.ENDED')
              : t('DOCK.DONE'),
    elapsedLabel: formatElapsed(live?.elapsedSec ?? 0),
    progressLabel: t('DOCK.PROGRESS', { done: marked.size, total: walkable.length }),
    progressValue: marked.size,
    progressMax: walkable.length,
    progressStyle: {
      '--dock-progress': `${String(walkable.length === 0 ? 0 : marked.size / walkable.length)}`,
    } as CSSProperties,
    caseId: caseId ?? '',
    caseTitle: testCase?.title ?? '',
    line:
      phase === 'preparing'
        ? doing
        : phase === 'turn'
          ? (manual.prep ?? t('DOCK.CHROME_NOTE'))
          : summary === ''
            ? t('DOCK.BACK')
            : summary,
    steps,
    expectedPrefix: manual.expectedPrefix,
    note: manual.note,
    notePlaceholder: manual.notePlaceholder,
    onNote: manual.onNote,
    canMark: manual.canMark,
    passedLabel: manual.passedLabel,
    failedLabel: manual.failedLabel,
    skipLabel: manual.skipLabel,
    onPassed: manual.onPassed,
    onFailed: manual.onFailed,
    onSkip: manual.onSkip,
    hasVariables: manual.hasVariables,
    variableLabel: manual.variableLabel,
    isPicking: manual.isPicking,
    variables: manual.variables,
    onPickVariable: manual.onPickVariable,
    endLabel: manual.endLabel,
    onEnd: manual.onEnd,
    passedKeys: comboLabelOf({ combo: MANUAL_DOCK.passedCombo, isMac }),
    failedKeys: comboLabelOf({ combo: MANUAL_DOCK.failedCombo, isMac }),
    passedKeysLabel: t('DOCK.KEYS_PASSED'),
    failedKeysLabel: t('DOCK.KEYS_FAILED'),
    stopLabel: t('DOCK.STOP'),
    onStop: () => {
      stopWorkspace(opened?.id ?? null);
    },
    backLabel: t('DOCK.BACK'),
  };
};
