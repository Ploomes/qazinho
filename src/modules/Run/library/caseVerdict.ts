import type { IRunStep, StepVerdict } from '@/modules/Run/types';

/**
 * Um caso aparece como a pior coisa que lhe aconteceu, para nunca dizer que falhou sem
 * nada ter falhado.
 */
export function caseVerdict(steps: Pick<IRunStep, 'verdict'>[]): StepVerdict {
  const verdicts = steps.map(({ verdict }) => verdict);

  if (verdicts.includes('failed')) return 'failed';
  if (verdicts.includes('blocked')) return 'blocked';
  if (verdicts.length > 0 && verdicts.every((verdict) => verdict === 'passed'))
    return 'passed';

  return 'skipped';
}
