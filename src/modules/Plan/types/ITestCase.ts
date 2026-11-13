import type { ITestStep } from './ITestStep';
import type { Priority } from './Priority';
import type { StepVerdict } from '@/shared/types';

/**
 * Um caso no plano: o que cobre, os passos, se é à mão, de onde vem o esperado e as
 * dúvidas que o seguram.
 */
export interface ITestCase {
  id: string;
  title: string;
  priority: Priority;
  goal: string;
  preconditions: string;
  steps: ITestStep[];
  lastVerdict: StepVerdict | null;
  isManual?: boolean;
  sources?: string[];
  blockedBy?: string[];
}
