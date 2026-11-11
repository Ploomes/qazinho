import { describe, expect, it } from 'vitest';
import { siteOriginOf } from '@/main/classes/projects/SiteIcons/library';

describe('siteOriginOf', () => {
  it('gives the origin of an http or https address, its path dropped', () => {
    expect(siteOriginOf('https://staging.loja.test/carrinho?x=1')).toBe(
      'https://staging.loja.test',
    );
    expect(siteOriginOf('http://localhost:3000/')).toBe('http://localhost:3000');
  });

  it('gives nothing for a build, a file or a word that is not an address', () => {
    expect(siteOriginOf('/Users/qa/loja.apk')).toBeNull();
    expect(siteOriginOf('C:\\builds\\Loja.app')).toBeNull();
    expect(siteOriginOf('file:///tmp/a.html')).toBeNull();
    expect(siteOriginOf('loja')).toBeNull();
  });
});
