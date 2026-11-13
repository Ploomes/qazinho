import { describe, expect, it } from 'vitest';
import { storyKeyOf } from '@/modules/Home/library';

describe('storyKeyOf', () => {
  it('reads a key typed alone, in any case', () => {
    expect(storyKeyOf(' shop-878 ')).toBe('SHOP-878');
  });

  it('reads the key out of a link to the story or a board that opened it', () => {
    expect(storyKeyOf('https://shop.atlassian.net/browse/SHOP-878')).toBe('SHOP-878');
    expect(
      storyKeyOf(
        'https://shop.atlassian.net/jira/software/projects/SHOP/boards/1?selectedIssue=SHOP-12',
      ),
    ).toBe('SHOP-12');
  });

  it('reads nothing from the address of an app', () => {
    expect(storyKeyOf('staging.shop.test')).toBeNull();
    expect(storyKeyOf('https://shop.test/browse')).toBeNull();
  });
});
