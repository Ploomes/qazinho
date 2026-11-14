import { describe, expect, it } from 'vitest';
import { missingPicksOf } from '@/modules/Home/library';
import { EMPTY_VALUES, STORY } from './fixtures';

describe('missingPicksOf', () => {
  it('names each picked card still waiting for its value', () => {
    expect(
      missingPicksOf({ picks: ['web', 'story', 'tests'], values: EMPTY_VALUES }),
    ).toEqual(['web', 'story', 'tests']);
  });

  it('counts an address only once it is one', () => {
    expect(
      missingPicksOf({
        picks: ['web'],
        values: { ...EMPTY_VALUES, web: 'a loja de staging' },
      }),
    ).toEqual(['web']);
    expect(
      missingPicksOf({
        picks: ['web', 'story'],
        values: { ...EMPTY_VALUES, web: 'https://staging.loja.dev', story: STORY },
      }),
    ).toEqual([]);
  });

  it('asks nothing of a card that was not picked, or of "nothing"', () => {
    expect(missingPicksOf({ picks: ['none'], values: EMPTY_VALUES })).toEqual([]);
  });
});
