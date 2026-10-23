import type { IInstallStep, ISetupInstaller } from './types';
import type {
  IInstallResult,
  InstallableId,
  ISetupEvent,
  IToolStatus,
} from '@/shared/types';
import { homedir } from 'node:os';
import { delimiter, isAbsolute } from 'node:path';
import { findOnPath, spawnCommand } from '@/main/library';
import { INSTALL } from './constants';
import { commandLineOf, explainFailure, linesOf, recipeFor } from './library';

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
    const steps = recipeFor({ item, home: homedir(), platform: process.platform });
    const command = commandLineOf(steps);

    if (this.installing.has(item))
      return {
        isInstalled: false,
        error: `${item} is already installing.`,
        command,
        isFix: false,
      };

    this.installing.add(item);

    try {
      const directories = await this.directories();

      for (const [index, step] of steps.entries()) {
        const at = { item, stage: index + 1, stages: steps.length };
        const path = this.resolve({ command: step.command, directories });

        if (path === null)
          return {
            isInstalled: false,
            error:
              INSTALL.missing[step.command] ??
              `${step.command} is not on this machine. Run the command below in a terminal.`,
            command,
            isFix: false,
          };

        if (await this.isDone({ step, directories })) {
          this.onEvent({ ...at, line: `✓ ${[step.command, ...step.args].join(' ')}` });

          continue;
        }

        const failed = await this.runStep({ ...at, path, step, directories });

        if (failed === null) continue;

        if (await this.isDone({ step, directories })) {
          this.onEvent({ ...at, line: failed.error.split('\n')[0] ?? '' });

          continue;
        }

        return {
          isInstalled: false,
          error: failed.error,
          command: failed.fix ?? command,
          isFix: failed.fix !== null,
        };
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
  }): Promise<{ error: string; fix: string | null } | null> {
    const { item, path, step, stage, stages, directories } = props;
    const tail: string[] = [];
    const say = (line: string) => {
      this.onEvent({ item, stage, stages, line });
    };

    say(`$ ${[step.command, ...step.args].join(' ')}`);

    return new Promise((settle) => {
      const child = spawnCommand({
        command: path,
        args: step.args,
        options: {
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PATH: directories.join(delimiter),
            HOMEBREW_NO_AUTO_UPDATE: '1',
            HOMEBREW_NO_ENV_HINTS: '1',
            NONINTERACTIVE: '1',
          },
        },
      });

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
      }, INSTALL.timeoutMs);

      const read = (chunk: Buffer) => {
        const lines = linesOf(chunk.toString());
        const last = lines.at(-1);

        if (last === undefined) return;

        tail.push(...lines);
        tail.splice(0, Math.max(0, tail.length - INSTALL.tailLines));
        say(last);
      };

      child.stdout.on('data', read);
      child.stderr.on('data', read);

      child.on('error', (reason) => {
        clearTimeout(timeout);
        settle({ error: reason.message, fix: null });
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        settle(
          code === 0
            ? null
            : tail.length === 0
              ? { error: `${step.command} stopped with code ${String(code)}.`, fix: null }
              : explainFailure(tail),
        );
      });
    });
  }

  private resolve(props: { command: string; directories: string[] }): string | null {
    return isAbsolute(props.command)
      ? props.command
      : findOnPath({ command: props.command, directories: props.directories });
  }

  /** Whether a step's goal is already met, so it is skipped, or was met even though the step complained. */
  private async isDone(props: {
    step: IInstallStep;
    directories: string[];
  }): Promise<boolean> {
    const check = props.step.doneIf;
    const path =
      check === undefined
        ? null
        : this.resolve({ command: check.command, directories: props.directories });

    if (check === undefined || path === null) return false;

    return new Promise((settle) => {
      const child = spawnCommand({
        command: path,
        args: check.args,
        options: {
          stdio: 'ignore',
          env: {
            ...process.env,
            PATH: props.directories.join(delimiter),
            HOMEBREW_NO_AUTO_UPDATE: '1',
          },
        },
      });
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
      }, INSTALL.checkTimeoutMs);

      child.on('error', () => {
        clearTimeout(timeout);
        settle(false);
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        settle(code === 0);
      });
    });
  }
}
