import type { IRunStep, StepVerdict } from '@/modules/Run/types';

/** A case reads as the worst thing that happened to it, so it never says failed with nothing failed. */
export function caseVerdict(steps: Pick<IRunStep, 'verdict'>[]): StepVerdict {
  const verdicts = steps.map(({ verdict }) => verdict);

  if (verdicts.includes('failed')) return 'failed';
  if (verdicts.includes('blocked')) return 'blocked';
  if (verdicts.length > 0 && verdicts.every((verdict) => verdict === 'passed'))
    return 'passed';

  return 'skipped';
}
