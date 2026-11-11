import { describe, expect, it } from 'vitest';
import { HOME_ITEMS } from '@/modules/Home/constants';

describe('HOME_ITEMS', () => {
  it('paints what waits on the QA in attention and what failed in the fail color', () => {
    expect([HOME_ITEMS.asking.tone, HOME_ITEMS.toContinue.tone]).toEqual([
      'var(--attn)',
      'var(--attn)',
    ]);
    expect(HOME_ITEMS.failed.tone).toBe('var(--fail)');
  });

  /** Só a pergunta pisca e só a run pulsa: o resto da tela fica parado. */
  it('moves only the question and the run that goes', () => {
    expect(
      Object.entries(HOME_ITEMS)
        .filter(([, { animation }]) => animation !== 'none')
        .map(([kind]) => kind),
    ).toEqual(['asking', 'running']);
  });
});
