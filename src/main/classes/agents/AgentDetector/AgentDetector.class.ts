import type { IDetectedAgent } from '@/shared/types';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findOnPath, machineDirectories } from '@/main/library';
import { AGENT_PROBES } from './constants';
import { defaultModelOf, isSignedInOf, statusOf } from './library';

/**
 * Finds the agents already on this machine with file probes, then asks each one found
 * whether it is signed in.
 */
export class AgentDetector {
  private detected: IDetectedAgent[] | null = null;

  /**
   * Cached for the session: a Settings panel that remounts must not re-probe the disk.
   */
  public async detect(): Promise<IDetectedAgent[]> {
    if (this.detected) return this.detected;

    const directories = await machineDirectories();

    this.detected = await Promise.all(
      AGENT_PROBES.map(async ({ config, status, ...probe }) => {
        const found = findOnPath({ command: probe.command, directories });
        const text = await readFile(join(homedir(), config.file), 'utf8').catch(
          () => null,
        );

        const signedIn =
          found === null
            ? null
            : isSignedInOf({
                reads: status.reads,
                ...(await statusOf({ command: found, args: status.args })),
              });

        return {
          ...probe,
          isFound: found !== null,
          path: found,
          defaultModel:
            text === null ? null : defaultModelOf({ format: config.format, text }),
          isSignedIn: signedIn,
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
