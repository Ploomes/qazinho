import { describe, expect, it } from 'vitest';
import { proPageUrlOf } from '@/main/library';

describe('proPageUrlOf', () => {
  it('puts a path of the site under its address', () => {
    expect(
      proPageUrlOf({
        base: 'https://qazinho.salvesoftware.com',
        path: '/loja/plans/plan-1',
      }),
    ).toBe('https://qazinho.salvesoftware.com/loja/plans/plan-1');
    expect(
      proPageUrlOf({ base: 'http://localhost:5180', path: '/loja/ci/new?plan=plan-1' }),
    ).toBe('http://localhost:5180/loja/ci/new?plan=plan-1');
  });

  it('refuses a path that would leave the site', () => {
    expect(
      proPageUrlOf({ base: 'https://qazinho.salvesoftware.com', path: '//evil.test/x' }),
    ).toBeNull();
    expect(
      proPageUrlOf({
        base: 'https://qazinho.salvesoftware.com',
        path: 'https://evil.test',
      }),
    ).toBeNull();
    expect(
      proPageUrlOf({ base: 'https://qazinho.salvesoftware.com', path: '/\\evil.test' }),
    ).toBeNull();
  });

  it('refuses anything when the site’s own address does not read', () => {
    expect(proPageUrlOf({ base: 'not a url', path: '/loja' })).toBeNull();
  });
});
