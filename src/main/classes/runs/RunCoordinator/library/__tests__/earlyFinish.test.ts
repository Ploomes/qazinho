import { describe, expect, it } from 'vitest';
import { earlyFinish } from '@/main/classes/runs/RunCoordinator/library';

const TEN_MINUTES = 10 * 60_000;

describe('earlyFinish', () => {
  it('sends an explorer back while more than a third of its time is left', () => {
    expect(earlyFinish({ leftMs: 9 * 60_000, totalMs: TEN_MINUTES })).toMatch(
      /^About 9 minutes are still left: use them\. Try what you have not yet/,
    );
  });

  it('lets an explorer finish once most of its time is spent', () => {
    expect(earlyFinish({ leftMs: 3 * 60_000, totalMs: TEN_MINUTES })).toBeNull();
    expect(earlyFinish({ leftMs: -1, totalMs: TEN_MINUTES })).toBeNull();
  });

  it('says one minute in the singular', () => {
    expect(earlyFinish({ leftMs: 70_000, totalMs: 2 * 60_000 })).toMatch(
      /^About 1 minute is still left: use it\./,
    );
  });

  /** Haiku called a cart's R$ 180,00 right for a R$ 50,00 shirt and a R$ 120,00 headset. */
  it('sends an explorer back to work out the sums the app showed', () => {
    expect(earlyFinish({ leftMs: 9 * 60_000, totalMs: TEN_MINUTES })).toContain(
      'each sum the app works out, done again by you',
    );
  });

  /** Haiku explored a bank's sign-in screen for 42 seconds and called it the whole app. */
  it('reminds an explorer stopped at a sign-in that the QA holds the way in', () => {
    expect(earlyFinish({ leftMs: 9 * 60_000, totalMs: TEN_MINUTES })).toContain(
      'When a sign-in or a code stands in your way, ask the QA for it with ask_qa.',
    );
  });
});
