import type { IImportScanner } from './types';
import type { IImportSource, ImportPick } from '@/shared/types';
import { realpath, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { flowsIn, listFolder, readManifests, recognizeTests } from './library';

/**
 * Lê uma pasta de testes que o QA escolheu e diz o que ela guarda; só uma pasta que ele
 * escolheu por aqui pode ser lida de novo para o agente.
 */
export class ImportScanner {
  private readonly git: IImportScanner['git'];
  private readonly picked = new Set<string>();

  public constructor(props: IImportScanner) {
    this.git = props.git;
  }

  /** Lê a pasta que o QA escolheu e a guarda como uma que o agente pode ler. */
  public async pick(path: string): Promise<ImportPick> {
    const scanned = await this.scan(path);

    if (scanned === null) return { kind: 'failed', reason: 'unreadable' };

    if (scanned.total === 0) return { kind: 'failed', reason: 'empty' };

    this.picked.add(scanned.source.dir);

    return { kind: 'picked', source: scanned.source };
  }

  /** A pasta de uma escolha anterior lida de novo; null para uma que ninguém escolheu. */
  public async sourceOf(path: string): Promise<IImportSource | null> {
    if (!this.picked.has(path)) return null;

    return (await this.scan(path))?.source ?? null;
  }

  private async scan(
    path: string,
  ): Promise<{ source: IImportSource; total: number } | null> {
    const dir = await realpath(path).catch(() => null);

    if (dir === null || !(await stat(dir)).isDirectory()) return null;

    const everything = await listFolder(dir);
    const [manifests, flows, branch, commit] = await Promise.all([
      readManifests({ root: dir, files: everything }),
      flowsIn({ root: dir, files: everything }),
      this.git.run({ cwd: dir, args: ['rev-parse', '--abbrev-ref', 'HEAD'] }),
      this.git.run({ cwd: dir, args: ['rev-parse', 'HEAD'] }),
    ]);
    const { frameworks, tests } = recognizeTests({
      files: everything,
      manifests,
      flows,
    });

    return {
      total: everything.length,
      source: {
        name: basename(dir),
        dir,
        frameworks,
        files: tests,
        branch: branch.isOk ? branch.text.trim() : null,
        commit: commit.isOk ? commit.text.trim() : null,
      },
    };
  }
}
