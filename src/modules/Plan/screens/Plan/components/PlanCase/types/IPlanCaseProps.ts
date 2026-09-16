import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { IRunCase } from '@/modules/Run/types';

export interface IPlanCaseProps {
  testCase: ITestCase;
  lastRun?: IRunCase;
  isOpen: boolean;
  isLocked: boolean;
  onToggle: (caseId: string) => void;
  onEditCase: (props: { caseId: string; fields: Partial<ITestCase> }) => void;
  onRemoveCase: (caseId: string) => void;
  onAddStep: (caseId: string) => void;
  onRemoveStep: (props: { caseId: string; index: number }) => void;
  onEditStep: (props: {
    caseId: string;
    index: number;
    step: Partial<ITestStep>;
  }) => void;
}
