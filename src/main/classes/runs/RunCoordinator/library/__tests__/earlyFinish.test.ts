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

  /**
   * O Haiku deu como certos os R$ 180,00 de um carrinho com uma camisa de R$ 50,00 e um
   * headset de R$ 120,00.
   */
  it('sends an explorer back to work out the sums the app showed', () => {
    expect(earlyFinish({ leftMs: 9 * 60_000, totalMs: TEN_MINUTES })).toContain(
      'each sum the app works out, done again by you',
    );
  });

  /**
   * O Haiku explorou a tela de login de um banco por 42 segundos e a chamou de app
   * inteiro.
   */
  it('reminds an explorer stopped at a sign-in that the QA holds the way in', () => {
    expect(earlyFinish({ leftMs: 9 * 60_000, totalMs: TEN_MINUTES })).toContain(
      'When a sign-in or a code stands in your way, ask the QA for it with ask_qa.',
    );
  });
});
