import type { ISaveTemplate, ITemplate, TemplateSaved } from '@/shared/types';

/** O único que chama o lado dos modelos da bridge. */
export class Templates {
  public static async list(): Promise<ITemplate[]> {
    return (await window.qazinho?.listTemplates()) ?? [];
  }

  public static async save(template: ISaveTemplate): Promise<TemplateSaved> {
    return (
      (await window.qazinho?.saveTemplate(template)) ?? {
        isSaved: false,
        reason: 'unwritable',
      }
    );
  }

  public static async remove(id: string): Promise<boolean> {
    return (await window.qazinho?.removeTemplate(id)) ?? false;
  }
}
