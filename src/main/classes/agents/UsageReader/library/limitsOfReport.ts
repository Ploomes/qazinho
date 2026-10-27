import type { IAgentLimits } from '@/shared/types';

const SESSION =
  /Current session:\s*(\d+(?:\.\d+)?)%\s*used(?:\s*·\s*resets\s+([^\n(]+))?/i;

const WEEK = /Current week \(all models\):\s*(\d+(?:\.\d+)?)%\s*used/i;

const RESET =
  /^(?:([A-Za-z]{3})[a-z]*\s+(\d{1,2})\s+at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i;

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const HALF_YEAR_MS = 183 * 24 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Reads the limits Claude Code's /usage printed: session and week as fractions; null with
 * no session.
 */
export function limitsOfReport(props: { text: string; now: Date }): IAgentLimits | null {
  const session = SESSION.exec(props.text);

  if (session === null) return null;

  const week = WEEK.exec(props.text);

  return {
    fiveHourUsed: Number(session[1]) / 100,
    sevenDayUsed: week === null ? null : Number(week[1]) / 100,
    resetsAt:
      session[2] === undefined ? 0 : resetOf({ said: session[2], now: props.now }),
  };
}

function resetOf(props: { said: string; now: Date }): number {
  const found = RESET.exec(props.said.trim());

  if (found === null) return 0;

  const [, month, day, hour, minute, half] = found;
  const { now } = props;
  const hours = (Number(hour) % 12) + (half?.toLowerCase() === 'pm' ? 12 : 0);
  const monthIndex = month === undefined ? -1 : MONTHS.indexOf(month.toLowerCase());

  if (month !== undefined && monthIndex < 0) return 0;

  const at =
    month === undefined
      ? new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          Number(minute ?? 0),
        )
      : new Date(now.getFullYear(), monthIndex, Number(day), hours, Number(minute ?? 0));

  if (month === undefined && at.getTime() < now.getTime())
    at.setTime(at.getTime() + DAY_MS);

  if (month !== undefined && now.getTime() - at.getTime() > HALF_YEAR_MS)
    at.setFullYear(at.getFullYear() + 1);

  return Math.floor(at.getTime() / 1_000);
}
