import type { ITestStep } from './ITestStep';
import type { Priority } from './Priority';
import type { StepVerdict } from '@/shared/types';

/** A case in the workspace's plan: what it covers, and the steps that cover it. */
export interface ITestCase {
  id: string;
  title: string;
  priority: Priority;
  goal: string;
  preconditions: string;
  steps: ITestStep[];
  lastVerdict: StepVerdict | null;
}
