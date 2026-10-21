import { describe, expect, it } from 'vitest';
import { limitsOfReport } from '@/main/classes/agents/UsageReader/library';

/** What Claude Code 2.1.302 printed for `claude -p /usage`, spending nothing. */
const REPORT = `You are currently using your subscription to power your Claude Code usage

Current session: 3% used · resets Oct 21 at 12:59pm (America/Sao_Paulo)
Current week (all models): 25% used · resets Oct 25 at 11:59pm (America/Sao_Paulo)
Current week (Fable): 0% used · resets Oct 26 at 12am (America/Sao_Paulo)

What's contributing to your limits usage?`;

const NOW = new Date(2026, 9, 21, 8, 5);
const secondOf = (date: Date) => Math.floor(date.getTime() / 1_000);

describe('limitsOfReport', () => {
  it('reads the session, the week, and when the session renews on the QA clock', () => {
    expect(limitsOfReport({ text: REPORT, now: NOW })).toEqual({
      fiveHourUsed: 0.03,
      sevenDayUsed: 0.25,
      resetsAt: secondOf(new Date(2026, 9, 21, 12, 59)),
    });
  });

  it('reads an hour with no minutes, and a reset with no day as the next time the clock gets there', () => {
    expect(
      limitsOfReport({ text: 'Current session: 40% used · resets 12am (UTC)', now: NOW })
        ?.resetsAt,
    ).toBe(secondOf(new Date(2026, 9, 22, 0, 0)));
    expect(
      limitsOfReport({ text: 'Current session: 40% used · resets 9:30am', now: NOW })
        ?.resetsAt,
    ).toBe(secondOf(new Date(2026, 9, 21, 9, 30)));
  });

  it('puts a January reset read in December in the next year', () => {
    expect(
      limitsOfReport({
        text: 'Current session: 10% used · resets Jan 2 at 1am (UTC)',
        now: new Date(2026, 11, 30, 22, 0),
      })?.resetsAt,
    ).toBe(secondOf(new Date(2027, 0, 2, 1, 0)));
  });

  it('keeps the session with no reset when it says none, and no week when it says none', () => {
    expect(limitsOfReport({ text: 'Current session: 0% used', now: NOW })).toEqual({
      fiveHourUsed: 0,
      sevenDayUsed: null,
      resetsAt: 0,
    });
  });

  it('does NOT read anything out of a report with no session, such as an API key in use', () => {
    expect(
      limitsOfReport({
        text: 'You are using an API key. Usage limits do not apply.',
        now: NOW,
      }),
    ).toBeNull();
  });
});
