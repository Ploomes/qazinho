import type { ITestCase } from '@/modules/Plan/types';

const PREFIX = 'TC-';

/** Ids carry into the runs and the bugs, so a new case never takes one already used. */
export function nextCaseId(plan: ITestCase[]): string {
  const used = plan
    .map(({ id }) => Number(id.startsWith(PREFIX) ? id.slice(PREFIX.length) : Number.NaN))
    .filter((number) => Number.isFinite(number));

  return `${PREFIX}${String(Math.max(0, ...used) + 1).padStart(2, '0')}`;
}
