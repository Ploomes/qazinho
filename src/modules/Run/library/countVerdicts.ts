import type { IRunCounts, StepVerdict } from '@/modules/Run/types';

export function countVerdicts(verdicts: StepVerdict[]): IRunCounts {
  return verdicts.reduce<IRunCounts>(
    (counts, verdict) => {
      if (verdict === 'passed') return { ...counts, passed: counts.passed + 1 };
      if (verdict === 'failed') return { ...counts, failed: counts.failed + 1 };
      if (verdict === 'blocked') return { ...counts, blocked: counts.blocked + 1 };
      if (verdict === 'skipped') return { ...counts, skipped: counts.skipped + 1 };
      return counts;
    },
    { passed: 0, failed: 0, blocked: 0, skipped: 0 },
  );
}
