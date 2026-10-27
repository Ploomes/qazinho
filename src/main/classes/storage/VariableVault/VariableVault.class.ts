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
 * Keeps each project's variables sealed by the OS keychain: the page and the agents learn
 * their names, and only a run reads a value, to type it.
 */
export class VariableVault {
  private readonly file: string;
  private readonly cipher: IVaultCipher;
  private queue: Promise<unknown> = Promise.resolve();

  public constructor(props: IVariableVault) {
    this.file = props.file;
    this.cipher = props.cipher;
  }

  /** Every project's variables, by name and description. */
  public async list(): Promise<IProjectVariables[]> {
    return variablesByProject((await this.read()) ?? []);
  }

  /**
   * Applies a project's changes together, or none of them, and says what it keeps now.
   */
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

  /** Gives a project a copy of another's variables, their values included. */
  public async copy(props: { from: string; to: string }): Promise<VariablesOutcome> {
    const values = await this.valuesOf(props.from);

    return this.apply({
      projectId: props.to,
      changes: values.map(({ name, description, value }) => ({
        kind: 'save',
        name,
        description,
        value,
        from: null,
      })),
    });
  }

  /** Drops every variable of a project that is gone. */
  public async forget(projectId: string): Promise<void> {
    await this.serial(async () => {
      const stored = await this.read();
      const kept = stored?.filter((one) => one.projectId !== projectId) ?? null;

      if (stored !== null && kept !== null && kept.length < stored.length)
        await this.write(kept);
    });
  }

  /** A project's variables with their values, for a run to type; never for the page. */
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
