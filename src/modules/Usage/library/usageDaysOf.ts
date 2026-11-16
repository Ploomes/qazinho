import type { IUsageDay } from '@/modules/Usage/types';
import type { IUsageRecord } from '@/shared/types';
import { dayKeyOf } from './dayKeyOf';
import { periodStartOf } from './periodStartOf';
import { tokensOf } from './tokensOf';

/** O gasto de cada um dos últimos dias, hoje por último, um dia sem gasto com zero. */
export function usageDaysOf(args: {
  records: readonly IUsageRecord[];
  days: number;
  now: number;
}): IUsageDay[] {
  const start = new Date(periodStartOf(args));
  const spent = new Map<string, IUsageDay>();

  for (let index = 0; index < args.days; index += 1) {
    const date = new Date(start);

    date.setDate(start.getDate() + index);

    const day = dayKeyOf(date.getTime());

    spent.set(day, { day, costUsd: 0, tokens: 0 });
  }

  for (const record of args.records) {
    const day = spent.get(dayKeyOf(record.at));

    if (day === undefined) continue;

    day.costUsd += record.costUsd ?? 0;
    day.tokens += tokensOf(record);
  }

  return [...spent.values()];
}
