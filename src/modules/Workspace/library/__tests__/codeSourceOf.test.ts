import { describe, expect, it } from 'vitest';
import { codeSourceOf } from '@/modules/Workspace/library';

const SOURCE = {
  repository: 'acme/loja-web',
  branch: 'feat/cupom',
  base: 'develop',
  commit: 'c0ffee0000',
};

describe('codeSourceOf', () => {
  it('reads back the code a plan was made from', () => {
    expect(codeSourceOf(SOURCE)).toEqual(SOURCE);
  });

  it('reads a plan made with no code, or saved before, as made from none', () => {
    expect(codeSourceOf(null)).toBeNull();
    expect(codeSourceOf(undefined)).toBeNull();
  });

  it('does NOT read a source missing any of its parts', () => {
    const { commit: _commit, ...partial } = SOURCE;

    expect(codeSourceOf(partial)).toBeNull();
    expect(codeSourceOf({ ...SOURCE, commit: 42 })).toBeNull();
  });
});
