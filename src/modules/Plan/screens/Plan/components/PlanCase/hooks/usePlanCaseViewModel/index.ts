import type { IPlanCaseProps } from '@/modules/Plan/screens/Plan/components/PlanCase/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { frameUrlOf } from '@/modules/Plan/library';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';

export const usePlanCaseViewModel = (props: IPlanCaseProps) => {
  const { testCase, isLocked, onToggle } = props;
  const design = props.design ?? null;
  const { t } = useTranslation();
  const caseId = testCase.id;
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [freshStep, setFreshStep] = useState<number | null>(null);

  const ran = props.lastRun?.steps ?? [];
  const stopped = ran.find(
    ({ verdict }) => verdict === 'failed' || verdict === 'blocked',
  );
  const isAllPassed = ran.length > 0 && ran.every(({ verdict }) => verdict === 'passed');

  return {
    summary:
      stopped !== undefined
        ? {
            tone:
              stopped.verdict === 'failed' ? ('failed' as const) : ('blocked' as const),
            text: t(
              stopped.verdict === 'failed'
                ? 'PLAN.CASE_FAILED_AT'
                : 'PLAN.CASE_BLOCKED_AT',
              {
                number: stopped.number,
                total: testCase.steps.length,
                action: stopped.action,
              },
            ),
            note: null,
          }
        : isAllPassed
          ? {
              tone: 'passed' as const,
              text: t(
                ran.length === 1 ? 'PLAN.CASE_PASSED_ONE' : 'PLAN.CASE_PASSED_OTHER',
                {
                  count: ran.length,
                },
              ),
              note: ran.some(({ by }) => by === 'healed')
                ? t('RUN.BY_HEALED')
                : ran.every(({ by }) => by === 'replay')
                  ? t('RUN.BY_REPLAY')
                  : null,
            }
          : null,
    priority: testCase.priority === 'P1' ? testCase.priority : null,
    expectLabel: t('PLAN.EXPECT'),
    className: isPickedUp ? 'plan-case plan-case--picked' : 'plan-case',
    steps: testCase.steps.map((step, index) => {
      const verdict =
        props.lastRun?.steps.find(({ number }) => number === index + 1)?.verdict ??
        'pending';

      return {
        ...step,
        number: index + 1,
        isFresh: index === freshStep,
        verdict,
        isVerdictShown: verdict !== 'passed' && verdict !== 'pending',
        verdictIcon: STATUS[verdict].icon,
        verdictLabel:
          verdict === 'skipped' ? t('PLAN.NOT_REACHED') : t(STATUS[verdict].labelKey),
        frame:
          design === null || step.frame === undefined
            ? null
            : {
                label: t('COMMANDS.DESIGN_NODE', { node: step.frame }),
                url: frameUrlOf({ design, frame: step.frame }),
                title: t('PLAN.FRAME_OPEN'),
              },
      };
    }),
    verdict: testCase.lastVerdict ?? 'pending',
    isTitleFocused: props.isFresh === true,
    canRemoveStep: testCase.steps.length > 1 && !isLocked,
    onHeadClick: () => {
      onToggle(caseId);
    },
    moveLabel: t('PLAN.MOVE_CASE'),
    onHeadKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (isLocked || !event.altKey) return;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

      event.preventDefault();
      props.onMoveCase({ caseId, by: event.key === 'ArrowUp' ? -1 : 1 });
    },
    onFieldCommit: (fields: Partial<ITestCase>) => {
      props.onEditCase({ caseId, fields });
    },
    onStepCommit: (change: { index: number; step: Partial<ITestStep> }) => {
      props.onEditStep({ caseId, ...change });
    },
    onStepAdd: () => {
      setFreshStep(testCase.steps.length);
      props.onAddStep(caseId);
    },
    onStepRemove: (index: number) => {
      props.onRemoveStep({ caseId, index });
    },
    onCaseRemove: () => {
      props.onRemoveCase(caseId);
    },
    onPickUp: () => {
      setIsPickedUp(true);
    },
    onPutDown: () => {
      setIsPickedUp(false);
    },
  };
};
