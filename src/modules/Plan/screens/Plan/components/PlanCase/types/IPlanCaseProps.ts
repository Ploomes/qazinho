import type { ITestCase } from '@/modules/Plan/types';

export interface IPlanCaseProps {
  testCase: ITestCase;
  isOpen: boolean;
  isLocked: boolean;
  onToggle: (caseId: string) => void;
}
