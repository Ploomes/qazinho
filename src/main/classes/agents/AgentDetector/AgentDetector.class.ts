import type { IDetectedAgent } from '@/types';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { findOnPath, mergePathSegments } from '@/main/library';
import { AGENT_PROBES, INSTALL_DIRS } from './constants';
import { defaultModelOf, hydrateShellPath } from './library';

/** Finds the agents already on this machine. gocrash installs nothing and downloads nothing. */
export class AgentDetector {
  private detected: IDetectedAgent[] | null = null;

  /** Cached for the session: a Settings panel that remounts must not re-probe the disk. */
  public async detect(): Promise<IDetectedAgent[]> {
    if (this.detected) return this.detected;

    const directories = await this.directories();

    this.detected = await Promise.all(
      AGENT_PROBES.map(async ({ config, ...probe }) => {
        const found = findOnPath({ command: probe.command, directories });
        const text = await readFile(join(homedir(), config.file), 'utf8').catch(
          () => null,
        );

        return {
          ...probe,
          isFound: found !== null,
          path: found,
          defaultModel:
            text === null ? null : defaultModelOf({ format: config.format, text }),
        };
      }),
    );

    return this.detected;
  }

  private async directories(): Promise<string[]> {
    const home = homedir();
    const installDirs = INSTALL_DIRS.map((directory) =>
      isAbsolute(directory) ? directory : join(home, directory),
    );

    return mergePathSegments([
      process.env.PATH,
      await hydrateShellPath(),
      ...installDirs,
    ]);
  }
}
