import { describe, expect, it } from 'vitest';
import { newWorkspaceIn } from '@/modules/Assistant/library';

const WEB = {
  id: 't-web',
  kind: 'web' as const,
  label: 'Web',
  value: 'https://shop.test',
};
const ANDROID = {
  id: 't-android',
  kind: 'android' as const,
  label: 'Android',
  value: '/a.apk',
};
const project = (targets: (typeof WEB | typeof ANDROID)[]) => ({
  id: 'p1',
  name: 'Loja',
  targets,
  repositories: [],
});

describe('newWorkspaceIn', () => {
  it('opens on the only target, with an empty plan', () => {
    const made = newWorkspaceIn({
      project: project([WEB]),
      name: 'Checkout',
      kind: undefined,
      now: 42,
    });

    expect(made).toMatchObject({
      isOk: true,
      target: WEB,
      workspace: { id: 'w-42', projectId: 'p1', targetId: 't-web', plan: [], runs: [] },
    });
  });

  it('asks which target when the project has more than one', () => {
    expect(
      newWorkspaceIn({
        project: project([WEB, ANDROID]),
        name: 'Checkout',
        kind: undefined,
        now: 42,
      }),
    ).toEqual({
      isOk: false,
      text: 'p1 tests on web, android: say which target the workspace is for.',
    });
  });

  it('does NOT open on a target the project lacks', () => {
    expect(
      newWorkspaceIn({ project: project([WEB]), name: 'Checkout', kind: 'ios', now: 42 }),
    ).toMatchObject({ isOk: false, text: 'p1 has no ios target. Its targets are web.' });
  });
});
