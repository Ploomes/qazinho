import type { IPlanCaseProps } from '@/modules/Plan/screens/Plan/components/PlanCase/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { caseSourceOf, frameUrlOf } from '@/modules/Plan/library';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';

export const usePlanCaseViewModel = (props: IPlanCaseProps) => {
  const { testCase, isLocked, onToggle } = props;
  const design = props.design ?? null;
  const { t, i18n } = useTranslation();
  const caseId = testCase.id;
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [freshStep, setFreshStep] = useState<number | null>(null);
  const [openFacts, setOpenFacts] = useState({
    goal: false,
    before: false,
    account: false,
  });

  const stopped = props.lastRun?.steps.find(
    ({ verdict }) => verdict === 'failed' || verdict === 'blocked',
  );
  const isNow =
    props.liveStatus === 'running' ||
    props.liveStatus === 'paused' ||
    props.liveStatus === 'attention';
  const isManual = testCase.isManual === true;
  const hasGoal = testCase.goal !== '';
  const hasBefore = testCase.preconditions !== '';
  const account = testCase.signedInAs ?? null;
  const accounts = props.accounts ?? [];
  const isAccountShown = account !== null || openFacts.account;
  const verdict = props.liveStatus ?? testCase.lastVerdict ?? 'pending';
  const listOf = (items: string[]) =>
    new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format(
      items,
    );
  const waitsOn = testCase.blockedBy ?? [];
  const sources = testCase.sources ?? [];
  const changeWhy = props.changeWhy ?? null;
  const reason = isNow
    ? ''
    : waitsOn.length > 0
      ? t('PLAN.REASON_WAITS', { ids: listOf(waitsOn) })
      : changeWhy !== null
        ? t('PLAN.REASON_TO_REVIEW')
        : stopped !== undefined
          ? t('PLAN.REASON_STEP', { number: stopped.number })
          : isManual
            ? t('PLAN.REASON_MANUAL')
            : props.isDeveloped === true
              ? ''
              : t('PLAN.REASON_TO_DEVELOP');

  return {
    reason,
    reasonClassName:
      !isNow && (waitsOn.length > 0 || changeWhy !== null)
        ? 'plan-case__reason plan-case__reason--waits'
        : 'plan-case__reason',
    reasonTip:
      !isNow && waitsOn.length === 0 && changeWhy !== null ? changeWhy : undefined,
    sources:
      sources.length === 0
        ? null
        : t('PLAN.CASE_SOURCES', {
            sources: listOf(
              sources.map((source) => {
                const word = caseSourceOf(source);

                return word === null
                  ? source
                  : t(word.key, { number: word.number, id: word.id });
              }),
            ),
          }),
    priority: reason === '' && testCase.priority === 'P1' ? testCase.priority : null,
    expectedPrefix: t('PLAN.EXPECTED_PREFIX'),
    gotPrefix: t('PLAN.GOT_PREFIX'),
    seeBugLabel: t('PLAN.SEE_BUG'),
    notReachedLabel: t('PLAN.NOT_REACHED'),
    className: [
      'plan-case',
      isPickedUp ? 'plan-case--picked' : '',
      props.isOpen ? 'plan-case--open' : '',
      isNow ? 'plan-case--now' : '',
    ]
      .filter((part) => part !== '')
      .join(' '),
    hasFacts:
      hasGoal || openFacts.goal || hasBefore || openFacts.before || isAccountShown,
    isGoalShown: hasGoal || openFacts.goal,
    isBeforeShown: hasBefore || openFacts.before,
    isAccountShown,
    canPickAccount: !isLocked,
    accountLabel: account ?? t('PLAN.ACCOUNT_PICK'),
    accountItems: [
      ...[...new Set([...accounts, ...(account === null ? [] : [account])])].map(
        (name) => ({
          key: name,
          label: name,
          icon: 'account' as const,
          onPick: () => {
            props.onEditCase({ caseId, fields: { signedInAs: name } });
          },
        }),
      ),
      ...(account === null
        ? []
        : [
            {
              key: '~none',
              label: t('PLAN.ACCOUNT_NONE'),
              icon: 'close' as const,
              onPick: () => {
                setOpenFacts((current) => ({ ...current, account: false }));
                props.onEditCase({ caseId, fields: { signedInAs: undefined } });
              },
            },
          ]),
    ],
    isGoalFocused: openFacts.goal && !hasGoal,
    isBeforeFocused: openFacts.before && !hasBefore,
    canAddGoal: !isLocked && !hasGoal && !openFacts.goal,
    canAddBefore: !isLocked && !hasBefore && !openFacts.before,
    canAddAccount: !isLocked && !isAccountShown && accounts.length > 0,
    steps: testCase.steps.map((step, index) => {
      const ran = props.lastRun?.steps.find(({ number }) => number === index + 1);
      const stepVerdict = ran?.verdict ?? 'pending';
      const isBad = stepVerdict === 'failed' || stepVerdict === 'blocked';
      const why = isBad ? (ran?.why ?? '') : '';

      return {
        ...step,
        number: index + 1,
        isFresh: index === freshStep,
        verdict: stepVerdict,
        isBad,
        isUnreached: stepVerdict === 'skipped',
        hasExpected: !isLocked || step.expected !== '',
        hasGotPrefix: why !== '',
        got: why !== '' ? why : t(STATUS[stepVerdict].labelKey),
        hasBug: isBad && (ran?.bugId ?? null) !== null && props.onOpenBug !== undefined,
        onBugClick: () => {
          if (ran?.bugId) props.onOpenBug?.(ran.bugId);
        },
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
    verdict,
    hasStatus:
      verdict !== 'passed' &&
      !(verdict === 'pending' && (props.isDeveloped === true || isManual)),
    isTitleFocused: props.isFresh === true,
    canRemoveStep: testCase.steps.length > 1 && !isLocked,
    onHeadClick: () => {
      setOpenFacts({ goal: false, before: false, account: false });
      onToggle(caseId);
    },
    onFactAdd: (fact: 'goal' | 'before' | 'account') => {
      setOpenFacts((current) => ({ ...current, [fact]: true }));
    },
    runCaseLabel: t(
      isManual
        ? 'PLAN.WALK_BY_HAND'
        : props.isDeveloped === true
          ? 'PLAN.RUN_CASE'
          : 'PLAN.DEVELOP_CASE',
    ),
    runIcon: isManual ? ('manual' as const) : ('play' as const),
    manualLabel: t(isManual ? 'PLAN.AUTOMATE' : 'PLAN.MAKE_MANUAL'),
    manualIcon: isManual ? ('play' as const) : ('manual' as const),
    onManualToggle: () => {
      props.onEditCase({ caseId, fields: { isManual: !isManual } });
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
