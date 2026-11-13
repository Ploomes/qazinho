import { describe, expect, it } from 'vitest';
import { autoProjectNameOf } from '@/modules/Home/library';
import { DESIGN, EMPTY_VALUES, STORY, TESTS } from './fixtures';

describe('autoProjectNameOf', () => {
  it('names the project by its site first, without the environment', () => {
    expect(
      autoProjectNameOf({
        picks: ['web', 'story'],
        values: { ...EMPTY_VALUES, web: 'https://staging.loja.dev', story: STORY },
      }),
    ).toBe('Loja');
  });

  it('falls back to the build, the repository, the design, the tests, the story', () => {
    expect(
      autoProjectNameOf({
        picks: ['build'],
        values: {
          ...EMPTY_VALUES,
          builds: [{ kind: 'android', path: '/b/loja-app-1.4.apk' }],
        },
      }),
    ).toBe('Loja app');
    expect(
      autoProjectNameOf({
        picks: ['code'],
        values: {
          ...EMPTY_VALUES,
          repositories: [
            { id: '1', owner: 'acme', name: 'loja-web', baseBranch: 'main' },
          ],
        },
      }),
    ).toBe('loja-web');
    expect(
      autoProjectNameOf({
        picks: ['design'],
        values: { ...EMPTY_VALUES, design: DESIGN },
      }),
    ).toBe('Checkout');
    expect(
      autoProjectNameOf({ picks: ['tests'], values: { ...EMPTY_VALUES, tests: TESTS } }),
    ).toBe('loja-web');
    expect(
      autoProjectNameOf({ picks: ['story'], values: { ...EMPTY_VALUES, story: STORY } }),
    ).toBe('SHOP');
  });

  it('ignores what a card no longer picked holds, and names nothing from nothing', () => {
    expect(
      autoProjectNameOf({
        picks: ['story'],
        values: { ...EMPTY_VALUES, web: 'https://loja.dev' },
      }),
    ).toBe('');
  });
});
