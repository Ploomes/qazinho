import type { IStoredVariable, IVariableVault } from './types';
import type { IVariableValue, IVaultCipher } from '@/main/types';
import type {
  IApplyVariables,
  IProjectVariables,
  VariablesOutcome,
} from '@/shared/types';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { writeAtomically } from '@/main/library';
import { variablesAfter, variablesByProject } from './library';

/**
 * Guarda as variáveis de cada projeto lacradas pelo keychain do SO: a página e os agentes
 * ficam sabendo os nomes, e só uma run lê um valor, para digitá-lo.
 */
export class VariableVault {
  private readonly file: string;
  private readonly cipher: IVaultCipher;
  private queue: Promise<unknown> = Promise.resolve();

  public constructor(props: IVariableVault) {
    this.file = props.file;
    this.cipher = props.cipher;
  }

  /** As variáveis de todo projeto, por nome e descrição. */
  public async list(): Promise<IProjectVariables[]> {
    return variablesByProject((await this.read()) ?? []);
  }

  /** Aplica as mudanças de um projeto juntas, ou nenhuma, e diz o que guarda agora. */
  public async apply(apply: IApplyVariables): Promise<VariablesOutcome> {
    if (!this.cipher.isAvailable())
      return { isSaved: false, failure: { reason: 'no-keychain' } };

    return this.serial(async (): Promise<VariablesOutcome> => {
      const stored = await this.read();

      if (stored === null) return { isSaved: false, failure: { reason: 'no-keychain' } };

      const after = variablesAfter({ stored, apply });

      if ('failure' in after) return { isSaved: false, failure: after.failure };

      await this.write(after.stored);

      return {
        isSaved: true,
        variables:
          variablesByProject(after.stored).find(
            ({ projectId }) => projectId === apply.projectId,
          )?.variables ?? [],
      };
    });
  }

  /** Dá a um projeto uma cópia das variáveis de outro, os valores incluídos. */
  public async copy(props: { from: string; to: string }): Promise<VariablesOutcome> {
    const stored = ((await this.read()) ?? []).filter(
      ({ projectId }) => projectId === props.from,
    );

    return this.apply({
      projectId: props.to,
      changes: stored.map(({ name, description, value, isSecret }) => ({
        kind: 'save',
        name,
        description,
        value,
        from: null,
        isSecret: isSecret ?? true,
      })),
    });
  }

  /** O valor de uma variável que o QA disse não ser segredo; de um segredo, nunca. */
  public async reveal(props: {
    projectId: string;
    name: string;
  }): Promise<string | null> {
    const found = ((await this.read()) ?? []).find(
      (one) => one.projectId === props.projectId && one.name === props.name,
    );

    return found?.isSecret === false ? found.value : null;
  }

  /** Descarta toda variável de um projeto que se foi. */
  public async forget(projectId: string): Promise<void> {
    await this.serial(async () => {
      const stored = await this.read();
      const kept = stored?.filter((one) => one.projectId !== projectId) ?? null;

      if (stored !== null && kept !== null && kept.length < stored.length)
        await this.write(kept);
    });
  }

  /**
   * As variáveis de um projeto com os valores, para uma run digitar; nunca para a página.
   */
  public async valuesOf(projectId: string): Promise<IVariableValue[]> {
    return ((await this.read()) ?? [])
      .filter((one) => one.projectId === projectId)
      .map(({ name, description, value }) => ({ name, description, value }));
  }

  private serial<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work, work);

    this.queue = next.catch(() => undefined);

    return next;
  }

  private async read(): Promise<IStoredVariable[] | null> {
    try {
      const stored: unknown = JSON.parse(this.cipher.decrypt(await readFile(this.file)));

      return Array.isArray(stored) ? (stored as IStoredVariable[]) : null;
    } catch (reason) {
      return (reason as NodeJS.ErrnoException).code === 'ENOENT' ? [] : null;
    }
  }

  private async write(stored: IStoredVariable[]): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeAtomically({
      file: this.file,
      data: this.cipher.encrypt(JSON.stringify(stored)),
    });
  }
}
