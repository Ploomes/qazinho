import type { ITemplateLibrary } from './types';
import type { ITemplate, TemplateSaved } from '@/shared/types';
import { readFile, writeFile } from 'node:fs/promises';
import { templatesOf } from './library';

/** Guarda os modelos do QA neste computador, num arquivo só, escrito inteiro. */
export class TemplateLibrary {
  private readonly file: string;
  private readonly now: () => string;
  private readonly newId: () => string;

  public constructor(props: ITemplateLibrary) {
    this.file = props.file;
    this.now = props.now;
    this.newId = props.newId;
  }

  /** Os modelos do QA, ou nenhum quando o arquivo ainda não existe. */
  public async list(): Promise<ITemplate[]> {
    return templatesOf(await readFile(this.file, 'utf8').catch(() => ''));
  }

  /** Guarda um modelo, novo ou no lugar do que tem o mesmo id, e diz como ficou. */
  public async save(
    template: Omit<ITemplate, 'id' | 'updatedAt'> & { id: string | null },
  ): Promise<TemplateSaved> {
    if (template.name.trim() === '') return { isSaved: false, reason: 'unnamed' };

    const kept = await this.list();
    const saved: ITemplate = {
      ...template,
      id: template.id ?? this.newId(),
      name: template.name.trim(),
      updatedAt: this.now(),
    };
    const next = kept.some(({ id }) => id === saved.id)
      ? kept.map((one) => (one.id === saved.id ? saved : one))
      : [...kept, saved];

    return writeFile(this.file, JSON.stringify(next, null, 2)).then(
      (): TemplateSaved => ({ isSaved: true, template: saved }),
      (): TemplateSaved => ({ isSaved: false, reason: 'unwritable' }),
    );
  }

  /** Apaga um modelo; false quando o arquivo não pôde ser escrito. */
  public async remove(id: string): Promise<boolean> {
    const kept = await this.list();

    return writeFile(
      this.file,
      JSON.stringify(
        kept.filter((one) => one.id !== id),
        null,
        2,
      ),
    ).then(
      () => true,
      () => false,
    );
  }
}
