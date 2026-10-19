const PREFIX = 'TC-';

/** Ids carry into the runs and the bugs, so a new case never takes one already used. */
export function nextCaseId(used: string[]): string {
  const numbers = used
    .map((id) => Number(id.startsWith(PREFIX) ? id.slice(PREFIX.length) : Number.NaN))
    .filter((number) => Number.isFinite(number));

  return `${PREFIX}${String(Math.max(0, ...numbers) + 1).padStart(2, '0')}`;
}
