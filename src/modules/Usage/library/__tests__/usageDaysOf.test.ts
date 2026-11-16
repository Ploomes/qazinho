import { describe, expect, it } from 'vitest';
import { periodStartOf, usageDaysOf } from '@/modules/Usage/library';
import { spend } from './fixtures';

const now = new Date(2026, 10, 16, 18, 0).getTime();

describe('usageDaysOf', () => {
  it('gives each of the last days, today last, a day with nothing at zero', () => {
    const days = usageDaysOf({
      records: [
        spend({ at: new Date(2026, 10, 16, 9, 0).getTime() }),
        spend({ at: new Date(2026, 10, 16, 23, 0).getTime(), costUsd: 0.25 }),
        spend({ at: new Date(2026, 10, 14, 1, 0).getTime(), costUsd: null }),
      ],
      days: 3,
      now,
    });

    expect(days).toEqual([
      { day: '2026-11-14', costUsd: 0, tokens: 1200 },
      { day: '2026-11-15', costUsd: 0, tokens: 0 },
      { day: '2026-11-16', costUsd: 0.75, tokens: 2400 },
    ]);
  });

  it('leaves out spend from before the first day', () => {
    const days = usageDaysOf({
      records: [spend({ at: new Date(2026, 10, 1).getTime() })],
      days: 7,
      now,
    });

    expect(days.every((day) => day.tokens === 0)).toBe(true);
  });
});

describe('periodStartOf', () => {
  it('starts at local midnight of the first day, counting today', () => {
    expect(periodStartOf({ days: 7, now })).toBe(new Date(2026, 10, 10).getTime());
  });
});
