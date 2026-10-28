import type { IRun } from '@/modules/Run/types';

/**
 * Quando uma run começou, como um momento ISO: o momento que ela guardou, senão quando a
 * gravação dela começou; null para uma run que não sabe nenhum.
 */
export function startedIsoOf(run: Pick<IRun, 'startedAtMs' | 'video'>): string | null {
  const ms = run.startedAtMs ?? run.video?.startedAt ?? null;

  return ms === null ? null : new Date(ms).toISOString();
}
