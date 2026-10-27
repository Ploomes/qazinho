import type { IAppLog, LogLevel } from './types';
import { appendFile, mkdir, readFile, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { APP_LOG } from './constants';
import { logLineOf } from './library';

/**
 * The app's own log, kept on this machine only: what went wrong and when, with no token,
 * password or user name in it, in a file that rolls over before it grows big.
 */
export class AppLog {
  private readonly folder: string;
  private readonly home: string;
  private writing: Promise<void> = Promise.resolve();

  public constructor(props: IAppLog) {
    this.folder = props.folder;
    this.home = props.home;
  }

  /** The folder the log lives in, for the QA to open. */
  public get where(): string {
    return this.folder;
  }

  /** Writes one line, after the ones before it; never throws. */
  public write(entry: { level: LogLevel; scope: string; message: string }): void {
    const line = logLineOf({ ...entry, at: new Date(), home: this.home });

    this.writing = this.writing.then(() => this.append(line)).catch(() => undefined);
  }

  /** The last lines written, the rolled-over file included, oldest first. */
  public async tail(lines: number): Promise<string[]> {
    await this.writing;

    const read = async (name: string) =>
      (await readFile(join(this.folder, name), 'utf8').catch(() => ''))
        .split('\n')
        .filter((one) => one !== '');

    return [...(await read(APP_LOG.older)), ...(await read(APP_LOG.file))].slice(-lines);
  }

  private async append(line: string): Promise<void> {
    const file = join(this.folder, APP_LOG.file);

    await mkdir(this.folder, { recursive: true });

    if (((await stat(file).catch(() => null))?.size ?? 0) > APP_LOG.maxBytes)
      await rename(file, join(this.folder, APP_LOG.older));

    await appendFile(file, line);
  }
}
