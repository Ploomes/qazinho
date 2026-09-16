import type { StepVerdict } from '@/modules/Run/types';
import { RUN_ENGINE } from '@/modules/Run/constants';

/** The step after the failure is skipped: the agent could not trust the state it left behind. */
export function verdictForStep(position: number): StepVerdict {
  if (position === RUN_ENGINE.failsAtStep) return 'failed';
  if (position === RUN_ENGINE.failsAtStep + 1) return 'skipped';
  return 'passed';
}
