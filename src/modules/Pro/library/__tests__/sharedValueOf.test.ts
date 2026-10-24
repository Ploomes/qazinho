import { describe, expect, it } from 'vitest';
import { sharedValueOf } from '@/modules/Pro/library';

describe('sharedValueOf', () => {
  it('keeps a web address as it is', () => {
    expect(sharedValueOf('https://staging.loja.dev')).toBe('https://staging.loja.dev');
  });

  it('takes a login out of a web address', () => {
    expect(sharedValueOf('https://ana:segredo@staging.loja.dev/app')).toBe(
      'https://staging.loja.dev/app',
    );
  });

  it('names a build by its file alone, on every platform', () => {
    expect(sharedValueOf('/Users/ana/builds/loja.apk')).toBe('loja.apk');
    expect(sharedValueOf('C:\\Users\\ana\\builds\\loja.apk')).toBe('loja.apk');
    expect(sharedValueOf('/home/ana/Loja.app')).toBe('Loja.app');
  });

  it('leaves a value that is neither alone', () => {
    expect(sharedValueOf('loja.apk')).toBe('loja.apk');
  });
});
