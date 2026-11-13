import { describe, expect, it } from 'vitest';
import { withPick } from '@/modules/Home/library';

describe('withPick', () => {
  it('marks and unmarks a card, keeping the order of the screen', () => {
    expect(withPick({ picks: ['story'], pick: 'web' })).toEqual(['web', 'story']);
    expect(withPick({ picks: ['web', 'story'], pick: 'web' })).toEqual(['story']);
  });

  it('never mixes "nothing" with the others', () => {
    expect(withPick({ picks: ['web', 'tests'], pick: 'none' })).toEqual(['none']);
    expect(withPick({ picks: ['none'], pick: 'build' })).toEqual(['build']);
    expect(withPick({ picks: ['none'], pick: 'none' })).toEqual([]);
  });
});
