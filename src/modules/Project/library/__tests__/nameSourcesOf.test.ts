import type { IProject } from '@/modules/Project/types';
import { describe, expect, it } from 'vitest';
import { nameSourcesOf } from '@/modules/Project/library';

const PROJECT: IProject = {
  id: 'p-1',
  name: 'Novo projeto',
  targets: [],
  repositories: [],
  isNamePending: true,
};

describe('nameSourcesOf', () => {
  it('reads the site first, then each build, then the first repository', () => {
    expect(
      nameSourcesOf({
        ...PROJECT,
        targets: [
          { id: 't-android', kind: 'android', label: 'Android', value: '/b/loja.apk' },
          { id: 't-web', kind: 'web', label: 'Web', value: 'https://loja.test' },
          { id: 't-ios', kind: 'ios', label: 'iOS', value: '/b/Loja.app' },
        ],
        repositories: [
          { id: '1', owner: 'acme', name: 'loja-app', baseBranch: 'main' },
          { id: '2', owner: 'acme', name: 'loja-api', baseBranch: 'main' },
        ],
      }),
    ).toEqual([
      { source: { kind: 'web', address: 'https://loja.test' }, from: 'site' },
      { source: { kind: 'android', path: '/b/loja.apk' }, from: 'build' },
      { source: { kind: 'ios', path: '/b/Loja.app' }, from: 'build' },
      {
        source: { kind: 'repo', owner: 'acme', name: 'loja-app', branch: 'main' },
        from: 'code',
      },
    ]);
  });

  it('has nothing to read for a project of a story or a design only', () => {
    expect(nameSourcesOf(PROJECT)).toEqual([]);
  });

  it('skips a build with no file chosen yet', () => {
    expect(
      nameSourcesOf({
        ...PROJECT,
        targets: [{ id: 't-android', kind: 'android', label: 'Android', value: '' }],
      }),
    ).toEqual([]);
  });
});
