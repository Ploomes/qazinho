import { randomUUID } from 'node:crypto';
import { chmod, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CATCHER_FILES, LINK_CATCHER } from './constants';

/**
 * Pega as páginas que uma CLI de agente pede a um navegador para abrir, por um `$BROWSER`
 * que as anota.
 */
export class LinkCatcher {
  private readonly script: string | null;
  private readonly file: string;

  private constructor(props: { script: string | null; file: string }) {
    this.script = props.script;
    this.file = props.file;
  }

  /** Escreve o pegador e começa uma lista nova, para uma run de agente. */
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

  /** O ambiente que manda os pedidos de navegador do agente ao pegador. */
  public env(): NodeJS.ProcessEnv {
    return this.script === null ? {} : { BROWSER: this.script, QAZINHO_LINKS: this.file };
  }

  /** As páginas que o agente pediu para abrir até agora, as mais antigas primeiro. */
  public async links(): Promise<string[]> {
    const said = await readFile(this.file, 'utf8').catch(() => '');

    return said
      .split(/\r?\n/)
      .map((link) => link.trim())
      .filter((link) => link !== '');
  }

  /** Joga a lista fora. */
  public dispose(): void {
    void rm(this.file, { force: true });
  }
}
