import type { IPlanCaseProps } from '@/modules/Plan/screens/Plan/components/PlanCase/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';

export const usePlanCaseViewModel = (props: IPlanCaseProps) => {
  const { testCase, isOpen, isLocked, onToggle } = props;
  const { t } = useTranslation();
  const caseId = testCase.id;
  const [isPickedUp, setIsPickedUp] = useState(false);

  return {
    className: isPickedUp ? 'plan-case plan-case--picked' : 'plan-case',
    steps: testCase.steps.map((step, index) => {
      const verdict =
        props.lastRun?.steps.find(({ number }) => number === index + 1)?.verdict ??
        'pending';

      return {
        ...step,
        number: index + 1,
        verdict,
        verdictGlyph: STATUS[verdict].glyph,
        verdictLabel: t(STATUS[verdict].labelKey),
      };
    }),
    caret: isOpen ? '▾' : '▸',
    verdict: testCase.lastVerdict ?? 'pending',
    canRemoveStep: testCase.steps.length > 1 && !isLocked,
    onHeadClick: () => {
      onToggle(caseId);
    },
    onFieldCommit: (fields: Partial<ITestCase>) => {
      props.onEditCase({ caseId, fields });
    },
    onStepCommit: (change: { index: number; step: Partial<ITestStep> }) => {
      props.onEditStep({ caseId, ...change });
    },
    onStepAdd: () => {
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
