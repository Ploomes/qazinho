import type { IPlanCaseProps } from '@/modules/Plan/screens/Plan/components/PlanCase/types';
import { useCallback } from 'react';

export const usePlanCaseViewModel = (props: IPlanCaseProps) => {
  const { testCase, isOpen, onToggle } = props;

  const onHeadClick = useCallback(() => {
    onToggle(testCase.id);
  }, [onToggle, testCase.id]);

  return {
    steps: testCase.steps.map((step, index) => ({ ...step, number: index + 1 })),
    caret: isOpen ? '▾' : '▸',
    verdict: testCase.lastVerdict ?? 'pending',
    onHeadClick,
  };
};
