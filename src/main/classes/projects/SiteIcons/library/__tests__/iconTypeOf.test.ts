import { describe, expect, it } from 'vitest';
import { iconTypeOf } from '@/main/classes/projects/SiteIcons/library';

describe('iconTypeOf', () => {
  it('trusts an image type the server declares, without its parameters', () => {
    expect(
      iconTypeOf({ contentType: 'image/PNG; charset=binary', url: 'https://a.test/x' }),
    ).toBe('image/png');
  });

  it('reads the extension when the server sends no type or a generic one', () => {
    expect(iconTypeOf({ contentType: null, url: 'https://a.test/favicon.ico' })).toBe(
      'image/x-icon',
    );
    expect(
      iconTypeOf({
        contentType: 'application/octet-stream',
        url: 'https://a.test/icon.svg?v=3',
      }),
    ).toBe('image/svg+xml');
  });

  /** Um SPA responde 200 com a página para qualquer caminho, o /favicon.ico incluído. */
  it('does NOT take a page served where the icon should be', () => {
    expect(
      iconTypeOf({ contentType: 'text/html', url: 'https://a.test/favicon.ico' }),
    ).toBeNull();
  });

  it('gives nothing for an address with no known image extension', () => {
    expect(iconTypeOf({ contentType: null, url: 'https://a.test/icon' })).toBeNull();
  });
});
