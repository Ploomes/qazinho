import { describe, expect, it } from 'vitest';
import { iconLinksIn } from '@/main/classes/projects/SiteIcons/library';

const PAGE = 'https://staging.loja.test/carrinho';

describe('iconLinksIn', () => {
  it('falls back to the favicon of the origin when the page declares none', () => {
    expect(iconLinksIn({ html: '<html><head></head></html>', page: PAGE })).toEqual([
      'https://staging.loja.test/favicon.ico',
    ]);
  });

  it('resolves each declared icon against the page, the sharpest first', () => {
    const html = `
      <link rel="icon" href="/favicon-16.png" sizes="16x16">
      <link rel="apple-touch-icon" href="/touch.png">
      <link rel="icon" type="image/svg+xml" href="icon.svg">
      <link rel="icon" href="/favicon-32.png" sizes="32x32">`;

    expect(iconLinksIn({ html, page: PAGE })).toEqual([
      'https://staging.loja.test/icon.svg',
      'https://staging.loja.test/touch.png',
      'https://staging.loja.test/favicon-32.png',
      'https://staging.loja.test/favicon-16.png',
      'https://staging.loja.test/favicon.ico',
    ]);
  });

  it('reads the older shortcut icon, single quotes and an encoded ampersand', () => {
    const html = `<LINK REL='shortcut icon' HREF='/f.ico?v=1&amp;x=2'>`;

    expect(iconLinksIn({ html, page: PAGE })[0]).toBe(
      'https://staging.loja.test/f.ico?v=1&x=2',
    );
  });

  /** O mask-icon do Safari é uma silhueta de uma cor só, que some num fundo escuro. */
  it('does NOT take the mask icon, a stylesheet or an inline image', () => {
    const html = `
      <link rel="mask-icon" href="/mask.svg">
      <link rel="stylesheet" href="/app.css">
      <link rel="icon" href="data:image/png;base64,AAAA">`;

    expect(iconLinksIn({ html, page: PAGE })).toEqual([
      'https://staging.loja.test/favicon.ico',
    ]);
  });

  it('lists an icon declared twice only once', () => {
    const html = '<link rel="icon" href="/favicon.ico">';

    expect(iconLinksIn({ html, page: PAGE })).toEqual([
      'https://staging.loja.test/favicon.ico',
    ]);
  });

  it('gives nothing for an address that is not a site', () => {
    expect(iconLinksIn({ html: '', page: '/Users/qa/app.apk' })).toEqual([]);
    expect(iconLinksIn({ html: '', page: 'file:///tmp/index.html' })).toEqual([]);
  });
});
