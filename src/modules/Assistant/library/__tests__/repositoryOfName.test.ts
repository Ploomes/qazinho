import { describe, expect, it } from 'vitest';
import { repositoryOfName } from '@/modules/Assistant/library';

describe('repositoryOfName', () => {
  it('reads owner/name, and the address GitHub shows', () => {
    expect(repositoryOfName(' acme/loja-web ')).toEqual({
      owner: 'acme',
      name: 'loja-web',
    });
    expect(repositoryOfName('https://github.com/acme/loja.web.git')).toEqual({
      owner: 'acme',
      name: 'loja.web',
    });
    expect(repositoryOfName('github.com/acme/loja/')).toEqual({
      owner: 'acme',
      name: 'loja',
    });
  });

  it('does NOT read a name alone, a deeper path or another host', () => {
    expect(repositoryOfName('loja-web')).toBeNull();
    expect(repositoryOfName('acme/loja/tree/main')).toBeNull();
    expect(repositoryOfName('https://gitlab.com/acme/loja')).toBeNull();
  });
});
