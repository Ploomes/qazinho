import type { IInstallStep, ISetupInstaller } from './types';
import type { IInstallResult, InstallableId, ISetupEvent, IToolStatus } from '@/types';
import { spawn } from 'node:child_process';
import { delimiter } from 'node:path';
import { findOnPath } from '@/main/library';
import { INSTALL, INSTALL_RECIPES } from './constants';
import { commandLineOf, lastLineOf } from './library';

/** Installs the light tools QAzinho drives, on the QA's say-so, and tells the page each line. */
export class SetupInstaller {
  private readonly onEvent: (event: ISetupEvent) => void;
  private readonly directories: () => Promise<string[]>;
  private readonly installing = new Set<InstallableId>();

  public constructor(props: ISetupInstaller) {
    this.onEvent = props.onEvent;
    this.directories = props.directories;
  }

  public async managers(): Promise<{ npm: IToolStatus; brew: IToolStatus }> {
    const directories = await this.directories();
    const npm = findOnPath({ command: 'npm', directories });
    const brew = findOnPath({ command: 'brew', directories });

    return {
      npm: { isFound: npm !== null, path: npm },
      brew: { isFound: brew !== null, path: brew },
    };
  }

  public async install(item: InstallableId): Promise<IInstallResult> {
    const steps = INSTALL_RECIPES[item];
    const command = commandLineOf(steps);

    if (this.installing.has(item))
      return { isInstalled: false, error: `${item} is already installing.`, command };

    this.installing.add(item);

    try {
      const directories = await this.directories();

      for (const [index, step] of steps.entries()) {
        const path = findOnPath({ command: step.command, directories });

        if (path === null)
          return { isInstalled: false, error: INSTALL.missing[step.command], command };

        const failed = await this.runStep({
          item,
          path,
          step,
          stage: index + 1,
          stages: steps.length,
          directories,
        });

        if (failed !== null) return { isInstalled: false, error: failed, command };
      }

      return { isInstalled: true };
    } finally {
      this.installing.delete(item);
    }
  }

  private runStep(props: {
    item: InstallableId;
    path: string;
    step: IInstallStep;
    stage: number;
    stages: number;
    directories: string[];
  }): Promise<string | null> {
    const { item, path, step, stage, stages, directories } = props;
    const tail: string[] = [];
    const say = (line: string) => {
      this.onEvent({ item, stage, stages, line });
    };

    say(`$ ${[step.command, ...step.args].join(' ')}`);

    return new Promise((settle) => {
      const child = spawn(path, step.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PATH: directories.join(delimiter),
          HOMEBREW_NO_AUTO_UPDATE: '1',
          HOMEBREW_NO_ENV_HINTS: '1',
          NONINTERACTIVE: '1',
        },
      });

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
      }, INSTALL.timeoutMs);

      const read = (chunk: Buffer) => {
        const line = lastLineOf(chunk.toString());

        if (line.length === 0) return;

        tail.push(line);
        tail.splice(0, Math.max(0, tail.length - INSTALL.tailLines));
        say(line);
      };

      child.stdout.on('data', read);
      child.stderr.on('data', read);

      child.on('error', (reason) => {
        clearTimeout(timeout);
        settle(reason.message);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        settle(
          code === 0
            ? null
            : tail.join('\n') || `${step.command} stopped with code ${String(code)}.`,
        );
      });
    });
  }
}
