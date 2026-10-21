import { describe, expect, it } from 'vitest';
import { urlPartsOf } from '@/modules/Run/library';

describe('urlPartsOf', () => {
  it('splits an address into its origin, its host and its path with the query', () => {
    expect(urlPartsOf('https://api.shop.test:8443/cart/items?page=2')).toEqual({
      origin: 'https://api.shop.test:8443',
      host: 'api.shop.test:8443',
      path: '/cart/items?page=2',
    });
  });

  it('leaves a login out of the host it shows', () => {
    expect(urlPartsOf('https://qa:•••@shop.test/admin').host).toBe('shop.test');
  });

  it('keeps a hidden value and a variable as written, never escaped', () => {
    expect(urlPartsOf('https://shop.test/u/${LOGIN}?token=•••').path).toBe(
      '/u/${LOGIN}?token=•••',
    );
  });

  it('reads a bare origin as its root, and drops what follows a hash', () => {
    expect(urlPartsOf('https://shop.test').path).toBe('/');
    expect(urlPartsOf('https://shop.test/a#top').path).toBe('/a');
  });

  it('compares origins in lower case, the way a browser does', () => {
    expect(urlPartsOf('HTTPS://Shop.Test/').origin).toBe('https://shop.test');
  });

  it('hands back an address it cannot read whole, as its path', () => {
    expect(urlPartsOf('not a url')).toEqual({
      origin: null,
      host: '',
      path: 'not a url',
    });
  });
});
