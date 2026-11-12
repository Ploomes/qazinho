import { describe, expect, it } from 'vitest';
import { screenNameOf } from '@/main/classes/runs/RunCoordinator/library';

describe('screenNameOf', () => {
  it('names a screen by its path', () => {
    expect(screenNameOf('https://salvesoftware.com/pt')).toBe('/pt');
    expect(screenNameOf('https://shop.test/cart/')).toBe('/cart');
  });

  it('keeps the query, which can be the whole difference between two screens', () => {
    expect(screenNameOf('https://shop.test/search?q=bolo')).toBe('/search?q=bolo');
  });

  it('names the root of a site by its host', () => {
    expect(screenNameOf('https://salvesoftware.com/')).toBe('salvesoftware.com');
  });

  it('keeps an address it cannot read as it came', () => {
    expect(screenNameOf('not a url')).toBe('not a url');
  });
});
