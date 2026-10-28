import type { CodeCopyResult, ICodeCopies, IGithubCode } from './types';
import type { CodeStep, ICodeAsk, ICodeCopy } from '@/shared/types';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CODE_COPIES } from './constants';
import { changesOf, filesInDiff, refPath } from './library';

/**
 * Copia o código de uma branch do GitHub para o agente ler enquanto planeja, com o que
 * ela mudou; cada cópia some assim que o plano dela some.
 */
export class CodeCopies {
  private readonly github: IGithubCode;
  private readonly root: string;
  private readonly now: () => number;
  private readonly copies = new Map<string, ICodeCopy>();

  public constructor(props: ICodeCopies) {
    this.github = props.github;
    this.root = props.root;
    this.now = props.now ?? Date.now;
  }

  /**
   * Copia uma branch para um workspace e lê o que ela mudou contra a base, no lugar de
   * qualquer cópia que o workspace tinha.
   */
  public async prepare(props: {
    workspaceId: string;
    code: ICodeAsk;
    onStep: (step: { at: CodeStep; bytes: number }) => void;
  }): Promise<CodeCopyResult> {
    const { workspaceId, code, onStep } = props;
    const repository = `${code.owner}/${code.name}`;
    const base = `repos/${repository}`;
    const isWhole = code.branch === code.base;

    await this.release(workspaceId);
    onStep({ at: 'commit', bytes: 0 });

    const [head, baseHead] = await Promise.all([
      this.github.api({ path: `${base}/commits/${refPath(code.branch)}`, jq: '.sha' }),
      isWhole
        ? Promise.resolve(null)
        : this.github.api({ path: `${base}/commits/${refPath(code.base)}`, jq: '.sha' }),
    ]);

    if (!head.isOk) return { isReady: false, failure: head.failure, said: head.said };
    if (baseHead !== null && !baseHead.isOk)
      return { isReady: false, failure: baseHead.failure, said: baseHead.said };

    const commit = head.text.trim();
    const baseCommit = baseHead === null ? null : baseHead.text.trim();
    const root = join(this.root, workspaceId);
    const dir = join(root, code.owner, code.name);

    onStep({ at: 'download', bytes: 0 });

    let toldAt = this.now();
    const extracted = await this.github.extract({
      path: `${base}/tarball/${commit}`,
      dir,
      onBytes: (bytes) => {
        if (this.now() - toldAt < CODE_COPIES.progressMs) return;

        toldAt = this.now();
        onStep({ at: 'download', bytes });
      },
    });

    if (!extracted.isOk) {
      await rm(root, { recursive: true, force: true });

      return { isReady: false, failure: extracted.failure, said: extracted.said };
    }

    const copy: ICodeCopy = {
      repository,
      branch: code.branch,
      base: code.base,
      commit,
      baseCommit,
      root,
      dir,
      diffFile: null,
      changes: [],
      changedFiles: 0,
      commits: 0,
    };

    if (baseCommit !== null) {
      onStep({ at: 'diff', bytes: 0 });
      Object.assign(copy, await this.compare({ base, root, code, baseCommit, commit }));
    }

    this.copies.set(workspaceId, copy);

    return { isReady: true, copy };
  }

  /** A cópia com que um workspace está planejando, ou null quando ele não tem nenhuma. */
  public copyOf(workspaceId: string): ICodeCopy | null {
    return this.copies.get(workspaceId) ?? null;
  }

  /**
   * Apaga do disco a cópia de um workspace, assim que o plano dele é escrito ou o
   * workspace se vai.
   */
  public async release(workspaceId: string): Promise<void> {
    this.copies.delete(workspaceId);
    await rm(join(this.root, workspaceId), { recursive: true, force: true });
  }

  /**
   * Apaga do disco toda cópia que sobrou, para quando o QAzinho abre depois de fechar no
   * meio de um plano.
   */
  public async sweep(): Promise<void> {
    this.copies.clear();
    await rm(this.root, { recursive: true, force: true });
  }

  private async compare(props: {
    base: string;
    root: string;
    code: ICodeAsk;
    baseCommit: string;
    commit: string;
  }): Promise<Pick<ICodeCopy, 'diffFile' | 'changes' | 'changedFiles' | 'commits'>> {
    const range = `${props.base}/compare/${props.baseCommit}...${props.commit}`;
    const [summary, diff] = await Promise.all([
      this.github.api({ path: range, jq: CODE_COPIES.compareJq }),
      this.github.api({ path: range, accept: CODE_COPIES.diffAccept }),
    ]);
    const read = summary.isOk ? changesOf(summary.text) : null;
    const changes = (read?.changes ?? []).slice(0, CODE_COPIES.changes);
    const isDiffKept = diff.isOk && Buffer.byteLength(diff.text) <= CODE_COPIES.diffBytes;
    const diffFile = isDiffKept
      ? join(props.root, `${props.code.owner}-${props.code.name}.diff`)
      : null;

    if (diffFile !== null && diff.isOk) {
      await mkdir(props.root, { recursive: true });
      await writeFile(diffFile, diff.text);
    }

    return {
      diffFile,
      changes,
      changedFiles: diff.isOk
        ? Math.max(filesInDiff(diff.text), changes.length)
        : changes.length,
      commits: read?.commits ?? 0,
    };
  }
}
