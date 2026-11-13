import type { ITestStep } from './ITestStep';
import type { Priority } from './Priority';
import type { StepVerdict } from '@/shared/types';

/**
 * Um caso no plano do workspace: o que ele cobre, os passos que o cobrem, e se o QA o
 * anda à mão.
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
}
