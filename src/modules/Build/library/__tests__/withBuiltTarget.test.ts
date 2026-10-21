import { describe, expect, it } from 'vitest';
import { withBuiltTarget } from '@/modules/Build/library';

const PROJECT = {
  id: 'p1',
  name: 'Lojinha',
  targets: [
    { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://loja.test' },
    { id: 't7', kind: 'android' as const, label: 'Android', value: '/old.apk' },
  ],
  repositories: [],
};

describe('withBuiltTarget', () => {
  it('puts a build in place of the target it replaces, keeping its id for the workspaces on it', () => {
    expect(
      withBuiltTarget({
        project: PROJECT,
        platform: 'android',
        artifact: '/new.apk',
        label: 'Android',
      }).targets,
    ).toEqual([
      { id: 't1', kind: 'web', label: 'Web', value: 'https://loja.test' },
      { id: 't7', kind: 'android', label: 'Android', value: '/new.apk' },
    ]);
  });

  it('adds a target the project did not have', () => {
    expect(
      withBuiltTarget({
        project: PROJECT,
        platform: 'ios',
        artifact: '/Loja.app',
        label: 'iOS',
      }).targets.at(-1),
    ).toEqual({ id: 't-ios', kind: 'ios', label: 'iOS', value: '/Loja.app' });
  });
});
