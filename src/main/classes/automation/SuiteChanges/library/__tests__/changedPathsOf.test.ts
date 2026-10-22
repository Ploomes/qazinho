import { describe, expect, it } from 'vitest';
import { changedPathsOf } from '@/main/classes/automation/SuiteChanges/library';

describe('changedPathsOf', () => {
  it('reads what changed, what is new to git and what went', () => {
    expect(
      changedPathsOf(
        ' M tests/hc-1/ct-nav.spec.ts\0?? tests/hc-1/pages/cart.page.ts\0 D tests/old.spec.ts\0A  tests/new.spec.ts\0',
      ),
    ).toEqual([
      { path: 'tests/hc-1/ct-nav.spec.ts', status: 'modified' },
      { path: 'tests/hc-1/pages/cart.page.ts', status: 'untracked' },
      { path: 'tests/old.spec.ts', status: 'deleted' },
      { path: 'tests/new.spec.ts', status: 'added' },
    ]);
  });

  /** With -z, a rename is its new path, then its old one in a field of its own. */
  it('takes a rename by its new path and skips the old one', () => {
    expect(
      changedPathsOf('R  tests/cart.spec.ts\0tests/carrinho.spec.ts\0 M a.ts\0'),
    ).toEqual([
      { path: 'tests/cart.spec.ts', status: 'renamed' },
      { path: 'a.ts', status: 'modified' },
    ]);
  });

  it('keeps a path with spaces whole, as -z writes it', () => {
    expect(changedPathsOf(' M tests/my test.spec.ts\0')).toEqual([
      { path: 'tests/my test.spec.ts', status: 'modified' },
    ]);
  });

  it('reads nothing out of a clean copy', () => {
    expect(changedPathsOf('')).toEqual([]);
  });
});
