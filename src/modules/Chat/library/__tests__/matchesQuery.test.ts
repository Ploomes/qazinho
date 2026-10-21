import { describe, expect, it } from 'vitest';
import { matchesQuery } from '@/modules/Chat/library';

describe('matchesQuery', () => {
  it('matches a text holding every word, in any order', () => {
    expect(
      matchesQuery({ text: 'feat/cupom · Cupom no checkout', query: 'checkout cupom' }),
    ).toBe(true);
  });

  it('does NOT match a text missing one of the words', () => {
    expect(matchesQuery({ text: 'feat/cupom', query: 'cupom frete' })).toBe(false);
  });

  it('cares for neither accents nor case, and matches anything with no words', () => {
    expect(matchesQuery({ text: 'Plano a partir do código', query: 'CODIGO' })).toBe(
      true,
    );
    expect(matchesQuery({ text: 'anything', query: '   ' })).toBe(true);
  });
});
