import type { ITestStep } from './ITestStep';
import type { Priority } from './Priority';
import type { StepVerdict } from '@/shared/types';

/** Um caso no plano do workspace: o que ele cobre, e os passos que o cobrem. */
export interface ITestCase {
  id: string;
  title: string;
  priority: Priority;
  goal: string;
  preconditions: string;
  steps: ITestStep[];
  lastVerdict: StepVerdict | null;
}
