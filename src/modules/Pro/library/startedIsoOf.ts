import type { IRun } from '@/modules/Run/types';

/** When a run started, as an ISO moment: the moment it kept, else when its recording began; null for a run that knows neither. */
export function startedIsoOf(run: Pick<IRun, 'startedAtMs' | 'video'>): string | null {
  const ms = run.startedAtMs ?? run.video?.startedAt ?? null;

  return ms === null ? null : new Date(ms).toISOString();
}
