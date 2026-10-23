import type { StepVerdict } from '@/modules/Run/types';

const RANK: Record<StepVerdict, number> = {
  failed: 0,
  blocked: 1,
  running: 2,
  pending: 3,
  skipped: 4,
  passed: 5,
};

/** Cases with what went wrong first, failed before blocked before skipped, then the ones that passed, each kind in the plan's order. */
export function exceptionFirst<T extends { verdict: StepVerdict }>(cases: T[]): T[] {
  return cases
    .map((runCase, index) => ({ runCase, index }))
    .sort(
      (a, b) => RANK[a.runCase.verdict] - RANK[b.runCase.verdict] || a.index - b.index,
    )
    .map(({ runCase }) => runCase);
}
