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
  const [openFacts, setOpenFacts] = useState({ goal: false, before: false });

  const ran = props.lastRun?.steps ?? [];
  const stopped = ran.find(
    ({ verdict }) => verdict === 'failed' || verdict === 'blocked',
  );
  const isAllPassed = ran.length > 0 && ran.every(({ verdict }) => verdict === 'passed');
  const hasGoal = testCase.goal !== '';
  const hasBefore = testCase.preconditions !== '';
  const how = ran.some(({ by }) => by === 'healed')
    ? ('healed' as const)
    : ran.every(({ by }) => by === 'replay')
      ? ('replay' as const)
      : null;

  return {
    outcome:
      stopped !== undefined
        ? {
            tone:
              stopped.verdict === 'failed' ? ('failed' as const) : ('blocked' as const),
            text: t(
              stopped.verdict === 'failed'
                ? 'PLAN.STEP_FAILED_AT'
                : 'PLAN.STEP_BLOCKED_AT',
              { number: stopped.number },
            ),
            note: null,
            noteTip: null,
          }
        : isAllPassed && how !== null
          ? {
              tone: 'passed' as const,
              text: null,
              note: t(how === 'healed' ? 'RUN.BY_HEALED' : 'RUN.BY_REPLAY'),
              noteTip: t(how === 'healed' ? 'RUN.BY_HEALED_TIP' : 'RUN.BY_REPLAY_TIP'),
            }
          : null,
    priority: testCase.priority === 'P1' ? testCase.priority : null,
    expectLabel: t('PLAN.EXPECT'),
    className: [
      'plan-case',
      isPickedUp ? 'plan-case--picked' : '',
      props.isOpen ? 'plan-case--open' : '',
    ]
      .filter((part) => part !== '')
      .join(' '),
    isGoalShown: hasGoal || openFacts.goal,
    isBeforeShown: hasBefore || openFacts.before,
    isGoalFocused: openFacts.goal && !hasGoal,
    isBeforeFocused: openFacts.before && !hasBefore,
    canAddGoal: !isLocked && !hasGoal && !openFacts.goal,
    canAddBefore: !isLocked && !hasBefore && !openFacts.before,
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
      setOpenFacts({ goal: false, before: false });
      onToggle(caseId);
    },
    onFactAdd: (fact: 'goal' | 'before') => {
      setOpenFacts((current) => ({ ...current, [fact]: true }));
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
