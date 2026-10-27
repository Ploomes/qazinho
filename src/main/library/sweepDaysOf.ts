const MOST_DAYS = 3650;

/**
 * How many days the page asked videos to be kept: a whole number from one to ten years;
 * null for anything else.
 */
export function sweepDaysOf(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MOST_DAYS
    ? value
    : null;
}
