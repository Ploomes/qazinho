import { describe, expect, it } from 'vitest';
import { shownUrlOf } from '@/modules/Device/library';

describe('shownUrlOf', () => {
  it('leaves out the user and password of a staging behind basic auth', () => {
    expect(shownUrlOf('https://qa:segredo@staging.loja.com/checkout')).toBe(
      'https://staging.loja.com/checkout',
    );
  });

  it('does NOT touch a URL with nothing to hide', () => {
    expect(shownUrlOf('http://127.0.0.1:5173/')).toBe('http://127.0.0.1:5173/');
  });

  it('shows what is not a URL as it was written', () => {
    expect(shownUrlOf('/tmp/app.apk')).toBe('/tmp/app.apk');
  });
});
