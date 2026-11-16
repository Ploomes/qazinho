import type { IUsageRow, UsageMetric } from '@/modules/Usage/types';
import type { IUsageRecord } from '@/shared/types';
import { tokensOf } from './tokensOf';

/** O gasto dividido pela chave de cada registro, da parte que mais gastou à que menos. */
export function usageRowsOf(args: {
  records: readonly IUsageRecord[];
  keyOf: (record: IUsageRecord) => string;
  metric: UsageMetric;
}): IUsageRow[] {
  const rows = new Map<string, IUsageRow>();

  for (const record of args.records) {
    const key = args.keyOf(record);
    const row = rows.get(key) ?? { key, costUsd: null, tokens: 0 };

    rows.set(key, {
      key,
      costUsd:
        record.costUsd === null ? row.costUsd : (row.costUsd ?? 0) + record.costUsd,
      tokens: row.tokens + tokensOf(record),
    });
  }

  return [...rows.values()].sort((first, second) =>
    args.metric === 'cost'
      ? (second.costUsd ?? -1) - (first.costUsd ?? -1) || second.tokens - first.tokens
      : second.tokens - first.tokens,
  );
}
