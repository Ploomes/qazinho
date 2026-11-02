import { describe, expect, it } from 'vitest';
import { FOLD } from '@/shared/components/molecules/Fold/constants';

describe('FOLD', () => {
  it('starts and ends closed and invisible, and rests open and visible', () => {
    expect(FOLD.initial).toEqual({ height: 0, opacity: 0 });
    expect(FOLD.exit).toMatchObject({ height: 0, opacity: 0 });
    expect(FOLD.animate).toMatchObject({ height: 'auto', opacity: 1 });
  });

  it('leaves faster than it comes, and always in under 200ms', () => {
    expect(FOLD.exit.transition.duration).toBeLessThan(FOLD.animate.transition.duration);
    expect(FOLD.exit.transition.duration).toBeLessThan(0.2);
  });
});
