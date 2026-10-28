const PREFIX = 'TC-';

/** Os ids vão para as runs e os bugs, então um caso novo nunca pega um já usado. */
export function nextCaseId(used: string[]): string {
  const numbers = used
    .map((id) => Number(id.startsWith(PREFIX) ? id.slice(PREFIX.length) : Number.NaN))
    .filter((number) => Number.isFinite(number));

  return `${PREFIX}${String(Math.max(0, ...numbers) + 1).padStart(2, '0')}`;
}
