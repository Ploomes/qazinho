import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { IRunCase } from '@/modules/Run';
import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';
import type { IDesignLink } from '@/shared/types';
import type { Ref } from 'react';

export interface IPlanCaseProps {
  ref?: Ref<HTMLLIElement>;
  testCase: ITestCase;
  lastRun?: IRunCase;
  liveStatus?: PillStatus;
  isDeveloped?: boolean;
  design?: IDesignLink | null;
  isOpen: boolean;
  isFresh?: boolean;
  changeWhy?: string;
  isLocked: boolean;
  onToggle: (caseId: string) => void;
  onRunCase?: (caseId: string) => void;
  onEditCase: (props: { caseId: string; fields: Partial<ITestCase> }) => void;
  onRemoveCase: (caseId: string) => void;
  onOpenBug?: (bugId: string) => void;
  onMoveCase: (props: { caseId: string; by: -1 | 1 }) => void;
  onAddStep: (caseId: string) => void;
  onRemoveStep: (props: { caseId: string; index: number }) => void;
  onEditStep: (props: {
    caseId: string;
    index: number;
    step: Partial<ITestStep>;
  }) => void;
}
