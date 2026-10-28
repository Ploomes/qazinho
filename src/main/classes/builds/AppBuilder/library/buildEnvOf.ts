import type { IBuildMachineFacts } from '@/main/classes/builds/AppBuilder/types';
import { join } from 'node:path';

/**
 * O ambiente em que um build roda: o PATH do QA, o SDK e o JDK avisados, sem prompts, e
 * para o Codex todo cache dentro da pasta onde o sandbox dele pode escrever.
 */
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
