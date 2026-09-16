import type { IRunCase, RunFilter } from '@/modules/Run/types';

/** A filter keeps the cases that still have something to show under it. */
export function filterCases(props: { cases: IRunCase[]; filter: RunFilter }): IRunCase[] {
  const { cases, filter } = props;

  if (filter === 'all') return cases;

  return cases
    .map((runCase) => ({
      ...runCase,
      steps: runCase.steps.filter((step) => step.verdict === filter),
    }))
    .filter((runCase) => runCase.steps.length > 0);
}
