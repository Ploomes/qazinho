import { describe, expect, it } from 'vitest';
import { projectNameOf } from '@/modules/Home/library';

const site = (value: string) => projectNameOf({ kind: 'web', value });

describe('projectNameOf', () => {
  it('names a site by its own word, without the environment or the domain', () => {
    expect(site('https://staging.loja.test/')).toBe('Loja');
    expect(site('https://www.minha-loja.com.br/carrinho')).toBe('Minha loja');
    expect(site('https://app.hml.rotuz.com')).toBe('Rotuz');
    expect(site('https://exemplo.dev')).toBe('Exemplo');
  });

  it('keeps the host and the port of a site on this machine', () => {
    expect(site('http://localhost:3000/')).toBe('localhost:3000');
    expect(site('http://192.168.0.10:8080')).toBe('192.168.0.10:8080');
  });

  it('names a build by its file, without the extension or the version', () => {
    expect(
      projectNameOf({ kind: 'android', value: '/Users/qa/builds/loja-1.4.2.apk' }),
    ).toBe('Loja');
    expect(projectNameOf({ kind: 'ios', value: 'C:\\builds\\App_da_Loja.app' })).toBe(
      'App da Loja',
    );
  });

  it('keeps a build named only by a version as it is', () => {
    expect(projectNameOf({ kind: 'android', value: '/b/1.4.apk' })).toBe('1.4.apk');
  });
});
