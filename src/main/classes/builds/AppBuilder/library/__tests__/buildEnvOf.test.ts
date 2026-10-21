import { describe, expect, it } from 'vitest';
import { buildEnvOf } from '@/main/classes/builds/AppBuilder/library';

const MACHINE = {
  androidSdk: '/sdk',
  javaHome: '/jdk',
  hasXcode: true,
  path: '/opt/homebrew/bin:/usr/bin:/bin',
};

describe('buildEnvOf', () => {
  it("hands the build the QA's PATH, the SDK and the JDK, and asks nothing", () => {
    expect(
      buildEnvOf({ machine: MACHINE, agentId: 'claude-code', dir: '/b/src' }),
    ).toEqual({
      PATH: '/opt/homebrew/bin:/usr/bin:/bin',
      CI: '1',
      ANDROID_HOME: '/sdk',
      ANDROID_SDK_ROOT: '/sdk',
      JAVA_HOME: '/jdk',
    });
  });

  it('keeps every cache inside the folder Codex may write in', () => {
    expect(
      buildEnvOf({ machine: MACHINE, agentId: 'codex', dir: '/b/src' }),
    ).toMatchObject({
      GRADLE_USER_HOME: '/b/src/.gradle-home',
      npm_config_cache: '/b/src/.npm-cache',
    });
  });

  it('does NOT point at a toolchain this machine does not have', () => {
    const env = buildEnvOf({
      machine: { ...MACHINE, androidSdk: null, javaHome: null },
      agentId: 'claude-code',
      dir: '/b/src',
    });

    expect(env).not.toHaveProperty('ANDROID_HOME');
    expect(env).not.toHaveProperty('JAVA_HOME');
  });
});
