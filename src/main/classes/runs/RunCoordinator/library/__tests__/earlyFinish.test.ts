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
});
