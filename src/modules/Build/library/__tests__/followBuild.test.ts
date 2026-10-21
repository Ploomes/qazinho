import type { IBuild } from '@/modules/Build/types';
import { describe, expect, it } from 'vitest';
import { followBuild } from '@/modules/Build/library';

const BUILD: IBuild = {
  id: 'b1',
  projectId: 'p1',
  platform: 'android',
  repository: 'acme/loja-app',
  branch: 'main',
  startedAt: 0,
  phase: 'working',
  step: 'code',
  bytes: 0,
  lines: [],
  result: null,
};

describe('followBuild', () => {
  it('moves to the step the build reached, with what it downloaded', () => {
    expect(
      followBuild({
        build: BUILD,
        event: { kind: 'step', buildId: 'b1', step: 'code', bytes: 2048 },
      }),
    ).toMatchObject({ step: 'code', bytes: 2048 });
  });

  it("keeps the agent's latest lines, and not the same line twice in a row", () => {
    let build = BUILD;

    for (const text of [
      '$ npm ci',
      '$ npm ci',
      '$ cd android',
      '$ ./gradlew assembleRelease',
      '✎ local.properties',
      '  ',
    ])
      build = followBuild({ build, event: { kind: 'line', buildId: 'b1', text } });

    expect(build.lines).toEqual([
      '$ npm ci',
      '$ cd android',
      '$ ./gradlew assembleRelease',
      '✎ local.properties',
    ]);

    build = followBuild({
      build,
      event: { kind: 'line', buildId: 'b1', text: 'Built.' },
    });

    expect(build.lines[0]).toBe('$ cd android');
  });

  it('ends built, failed or stopped, with how it ended', () => {
    const built = followBuild({
      build: BUILD,
      event: {
        kind: 'ended',
        buildId: 'b1',
        result: {
          isBuilt: true,
          artifact: '/apps/p1/a.apk',
          bytes: 9,
          commit: 'c0ffee1',
          summary: '',
        },
      },
    });
    const stopped = followBuild({
      build: BUILD,
      event: {
        kind: 'ended',
        buildId: 'b1',
        result: { isBuilt: false, failure: { reason: 'stopped' } },
      },
    });
    const failed = followBuild({
      build: BUILD,
      event: {
        kind: 'ended',
        buildId: 'b1',
        result: {
          isBuilt: false,
          failure: { reason: 'no-artifact', said: 'Falta o Java 17.' },
        },
      },
    });

    expect([built.phase, stopped.phase, failed.phase]).toEqual([
      'built',
      'stopped',
      'failed',
    ]);
    expect(built.result).toMatchObject({ artifact: '/apps/p1/a.apk' });
  });
});
