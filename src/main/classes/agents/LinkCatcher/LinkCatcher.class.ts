import { randomUUID } from 'node:crypto';
import { chmod, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CATCHER_FILES, LINK_CATCHER } from './constants';

/** Catches the pages an agent CLI asks a browser to open: the agent gets a `$BROWSER` that writes them down instead. On Windows, where a CLI would run a .cmd `$BROWSER` through a shell or not at all, the agent opens its own browser and nothing is caught. */
export class LinkCatcher {
  private readonly script: string | null;
  private readonly file: string;

  private constructor(props: { script: string | null; file: string }) {
    this.script = props.script;
    this.file = props.file;
  }

  /** Writes the catcher and starts a fresh list, for one agent run. */
  public static async create(): Promise<LinkCatcher> {
    const script =
      process.platform === 'win32' ? null : join(tmpdir(), CATCHER_FILES.script);

    if (script !== null) {
      await writeFile(script, LINK_CATCHER);
      await chmod(script, 0o755);
    }

    return new LinkCatcher({
      script,
      file: join(tmpdir(), `${CATCHER_FILES.linksPrefix}${randomUUID()}`),
    });
  }

  /** The environment that sends the agent's browser requests to the catcher. */
  public env(): NodeJS.ProcessEnv {
    return this.script === null ? {} : { BROWSER: this.script, QAZINHO_LINKS: this.file };
  }

  /** The pages the agent asked to open so far, oldest first. */
  public async links(): Promise<string[]> {
    const said = await readFile(this.file, 'utf8').catch(() => '');

    return said
      .split(/\r?\n/)
      .map((link) => link.trim())
      .filter((link) => link !== '');
  }

  /** Throws the list away. */
  public dispose(): void {
    void rm(this.file, { force: true });
  }
}
