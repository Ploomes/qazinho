import type { IAppLog, LogLevel } from './types';
import { appendFile, mkdir, readFile, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { APP_LOG } from './constants';
import { logLineOf } from './library';

/**
 * O log do próprio app, guardado só nesta máquina: o que deu errado e quando, sem token,
 * senha ou nome de usuário, num arquivo que gira antes de ficar grande.
 */
export class AppLog {
  private readonly folder: string;
  private readonly home: string;
  private writing: Promise<void> = Promise.resolve();

  public constructor(props: IAppLog) {
    this.folder = props.folder;
    this.home = props.home;
  }

  /** A pasta onde o log vive, para o QA abrir. */
  public get where(): string {
    return this.folder;
  }

  /** Escreve uma linha, depois das anteriores; nunca lança erro. */
  public write(entry: { level: LogLevel; scope: string; message: string }): void {
    const line = logLineOf({ ...entry, at: new Date(), home: this.home });

    this.writing = this.writing.then(() => this.append(line)).catch(() => undefined);
  }

  /** As últimas linhas escritas, o arquivo girado incluído, as mais antigas primeiro. */
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
