import type { IRun } from '@/modules/Run/types';

/**
 * O dia em que uma run começou no relógio do QA, como YYYY-MM-DD, lido do primeiro passo
 * que ela andou; null quando nenhum guardou a hora.
 */
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
