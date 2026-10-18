import { describe, expect, it } from 'vitest';
import { webAddressOf } from '@/modules/Project/library';

/**
 * A QA types "staging.shop.com" the way they would in a browser. The run used to hand that to
 * Chrome as it was, and Chrome cannot open an address with no scheme, so the run broke.
 */
describe('webAddressOf', () => {
  it('keeps an address that says how to reach it', () => {
    expect(webAddressOf('https://staging.shop.test/login')).toBe(
      'https://staging.shop.test/login',
    );
    expect(webAddressOf('  http://127.0.0.1:4310/  ')).toBe('http://127.0.0.1:4310/');
  });

  it('opens a site on the internet over https when the QA left the scheme out', () => {
    expect(webAddressOf('staging.shop.com')).toBe('https://staging.shop.com');
    expect(webAddressOf('shop.com/cart?x=1')).toBe('https://shop.com/cart?x=1');
  });

  it('opens this machine and its network over http, the way a dev server serves them', () => {
    expect(webAddressOf('localhost:3000')).toBe('http://localhost:3000');
    expect(webAddressOf('127.0.0.1:8080/app')).toBe('http://127.0.0.1:8080/app');
    expect(webAddressOf('192.168.0.12')).toBe('http://192.168.0.12');
    expect(webAddressOf('loja.test')).toBe('http://loja.test');
    expect(webAddressOf('api.localhost:4000')).toBe('http://api.localhost:4000');
    expect(webAddressOf('[::1]:3000')).toBe('http://[::1]:3000');
  });

  it('does NOT take a domain that only starts like a local one for local', () => {
    expect(webAddressOf('localhost.shop.com')).toBe('https://localhost.shop.com');
    expect(webAddressOf('tested.com')).toBe('https://tested.com');
  });

  it('refuses what a browser would not open', () => {
    expect(webAddressOf('')).toBeNull();
    expect(webAddressOf('my shop')).toBeNull();
    expect(webAddressOf('ftp://files.shop.com')).toBeNull();
    expect(webAddressOf('javascript:alert(1)')).toBeNull();
    expect(webAddressOf('https://')).toBeNull();
  });
});
