import type { IRun } from '@/modules/Run/types';

/** The day a run started on the QA's clock, as YYYY-MM-DD, read from the first step it walked; null when none kept its time. */
export function runDayOf(run: Pick<IRun, 'cases'>): string | null {
  const starts = run.cases
    .flatMap(({ steps }) => steps)
    .flatMap(({ span }) => (span === null ? [] : [span.from]));

  if (starts.length === 0) return null;

  const day = new Date(Math.min(...starts));

  return [
    String(day.getFullYear()),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0'),
  ].join('-');
}
