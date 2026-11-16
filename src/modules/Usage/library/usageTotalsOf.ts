import type { IUsageTotals } from '@/modules/Usage/types';
import type { IUsageRecord } from '@/shared/types';
import { tokensOf } from './tokensOf';

/** O gasto somado de vários registros, e se algum veio com custo e algum sem. */
export function usageTotalsOf(records: readonly IUsageRecord[]): IUsageTotals {
  return records.reduce<IUsageTotals>(
    (totals, record) => ({
      costUsd: totals.costUsd + (record.costUsd ?? 0),
      hasCost: totals.hasCost || record.costUsd !== null,
      hasUnpriced: totals.hasUnpriced || record.costUsd === null,
      input: totals.input + record.input,
      output: totals.output + record.output,
      cacheRead: totals.cacheRead + record.cacheRead,
      cacheWrite: totals.cacheWrite + record.cacheWrite,
      tokens: totals.tokens + tokensOf(record),
    }),
    {
      costUsd: 0,
      hasCost: false,
      hasUnpriced: false,
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      tokens: 0,
    },
  );
}
