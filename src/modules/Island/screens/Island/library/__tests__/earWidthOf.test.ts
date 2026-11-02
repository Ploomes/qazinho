import { describe, expect, it } from 'vitest';
import { earWidthOf } from '@/modules/Island/screens/Island/library';

describe('earWidthOf', () => {
  it('is as small as the Estagiário needs when there is no counter', () => {
    expect(earWidthOf('')).toBe(12 + 22);
  });

  it('grows with the counter, the way a longer one takes more room', () => {
    expect(earWidthOf('2/4')).toBe(12 + 14 + 3 * 7 + 4);
    expect(earWidthOf('10/12')).toBeGreaterThan(earWidthOf('2/4'));
  });

  it('never gets narrower than the Estagiário, whatever the counter', () => {
    expect(earWidthOf('1')).toBeGreaterThanOrEqual(12 + 22);
  });
});
