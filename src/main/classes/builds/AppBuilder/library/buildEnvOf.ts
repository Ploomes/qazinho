import type { IBuildMachineFacts } from '@/main/classes/builds/AppBuilder/types';
import { join } from 'node:path';

/** The environment a build runs in: the QA's PATH, the SDK and JDK it was told of, no prompts, and for Codex every cache kept inside the folder its sandbox may write. */
export function buildEnvOf(props: {
  machine: IBuildMachineFacts;
  agentId: string;
  dir: string;
}): Record<string, string> {
  const { machine, dir } = props;

  return {
    PATH: machine.path,
    CI: '1',
    ...(machine.androidSdk === null
      ? {}
      : { ANDROID_HOME: machine.androidSdk, ANDROID_SDK_ROOT: machine.androidSdk }),
    ...(machine.javaHome === null ? {} : { JAVA_HOME: machine.javaHome }),
    ...(props.agentId === 'codex'
      ? {
          GRADLE_USER_HOME: join(dir, '.gradle-home'),
          npm_config_cache: join(dir, '.npm-cache'),
        }
      : {}),
  };
}
