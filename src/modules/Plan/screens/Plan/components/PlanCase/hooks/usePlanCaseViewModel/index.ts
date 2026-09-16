import type { IPlanCaseProps } from '@/modules/Plan/screens/Plan/components/PlanCase/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';

export const usePlanCaseViewModel = (props: IPlanCaseProps) => {
  const { testCase, isOpen, isLocked, onToggle } = props;
  const caseId = testCase.id;

  return {
    steps: testCase.steps.map((step, index) => ({ ...step, number: index + 1 })),
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
  };
};
