import type { LastRunSayKey } from '@/modules/Device/types';

/** A frase que conta a última run: só falhas, só passados, ou os dois, nessa ordem. */
export function lastRunSayKeyOf(counts: {
  failed: number;
  passed: number;
}): LastRunSayKey {
  if (counts.failed === 0) return 'DEVICE.LAST_RUN_PASSED_ONLY';
  if (counts.passed === 0) return 'DEVICE.LAST_RUN_FAILED_ONLY';

  return 'DEVICE.LAST_RUN_MIXED';
}
