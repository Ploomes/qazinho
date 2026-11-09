import { describe, expect, it } from 'vitest';
import { earWidthsOf } from '@/modules/Island/screens/Island/library';

describe('earWidthsOf', () => {
  /** Uma orelha esquerda do tamanho da direita cobria os últimos menus do app em uso. */
  it('keeps the left ear to the Estagiário, however long the counter is', () => {
    expect(earWidthsOf('').left).toBe(12 + 22);
    expect(earWidthsOf('100/118').left).toBe(12 + 22);
  });

  it('grows the right ear with the counter, the way a longer one takes more room', () => {
    expect(earWidthsOf('2/4').right).toBe(12 + 14 + 3 * 7 + 4);
    expect(earWidthsOf('10/12').right).toBeGreaterThan(earWidthsOf('2/4').right);
  });

  it('leaves only the icon on the right with no counter', () => {
    expect(earWidthsOf('').right).toBe(12 + 14);
  });
});
