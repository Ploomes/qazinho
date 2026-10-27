import type { StepVerdict } from '@/shared/types';

/**
 * A verdict as a finished run keeps it: what never got past pending or running was
 * skipped.
 */
export function finishedVerdictOf(
  verdict: StepVerdict,
): 'passed' | 'failed' | 'blocked' | 'skipped' {
  return verdict === 'pending' || verdict === 'running' ? 'skipped' : verdict;
}
