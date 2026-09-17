import type { IDetectedAgent } from '@/types';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findOnPath, hydrateShellPath, searchDirectories } from '@/main/library';
import { AGENT_PROBES } from './constants';
import { defaultModelOf } from './library';

/** Finds the agents already on this machine, the way Orca does: file probes, no subprocess per agent. */
export class AgentDetector {
  private detected: IDetectedAgent[] | null = null;

  /** Cached for the session: a Settings panel that remounts must not re-probe the disk. */
  public async detect(): Promise<IDetectedAgent[]> {
    if (this.detected) return this.detected;

    const directories = searchDirectories({
      appPath: process.env.PATH,
      shellPath: await hydrateShellPath(),
      home: homedir(),
    });

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

  /** Drops the cache, so the next look sees what an install just put on disk. */
  public forget(): void {
    this.detected = null;
  }
}
