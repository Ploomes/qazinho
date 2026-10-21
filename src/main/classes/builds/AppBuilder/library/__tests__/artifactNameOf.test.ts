import { describe, expect, it } from 'vitest';
import { artifactNameOf } from '@/main/classes/builds/AppBuilder/library';

describe('artifactNameOf', () => {
  it('names a build by its repository, branch and short commit', () => {
    expect(
      artifactNameOf({
        repository: 'acme/loja-app',
        branch: 'feat/cupom',
        commit: 'c0ffee1234567',
        platform: 'android',
      }),
    ).toBe('acme-loja-app-feat-cupom-c0ffee1.apk');
    expect(
      artifactNameOf({
        repository: 'acme/Loja',
        branch: 'main',
        commit: 'abc',
        platform: 'ios',
      }),
    ).toBe('acme-Loja-main-abc.app');
  });
});
