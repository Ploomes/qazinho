import type {
  ISaveSkill,
  ISkill,
  ISkillDraftFile,
  ISkillFound,
  ISkillImport,
  IWriteSkill,
  SkillSaved,
  SkillsFound,
  SkillWritten,
} from '@/shared/types';

/**
 * O único que chama o lado das skills da bridge: a biblioteca do time, a importação, a
 * exportação e quem escreve uma skill com o QA.
 */
export class Skills {
  public static async list(): Promise<ISkill[]> {
    return (await window.qazinho?.listSkills()) ?? [];
  }

  public static async save(skill: ISaveSkill): Promise<SkillSaved> {
    return (
      (await window.qazinho?.saveSkill(skill)) ?? { isSaved: false, reason: 'no-name' }
    );
  }

  public static async remove(id: string): Promise<void> {
    await window.qazinho?.removeSkill(id);
  }

  public static async found(): Promise<ISkillFound[]> {
    return (await window.qazinho?.foundSkills()) ?? [];
  }

  public static async foundIn(props: {
    repository: string;
    branch: string;
    folder: string;
  }): Promise<SkillsFound> {
    return (
      (await window.qazinho?.foundSkillsIn(props)) ?? {
        isFound: false,
        reason: 'no-cli',
        said: '',
      }
    );
  }

  public static async import(request: ISkillImport): Promise<ISkill[]> {
    return (await window.qazinho?.importSkills(request)) ?? [];
  }

  public static async importFile(): Promise<ISkill[]> {
    return (await window.qazinho?.importSkillFile()) ?? [];
  }

  public static async refresh(): Promise<ISkill[]> {
    return (await window.qazinho?.refreshSkills()) ?? [];
  }

  public static async export(id: string): Promise<string | null> {
    return (await window.qazinho?.exportSkill(id)) ?? null;
  }

  public static async attach(draftId: string): Promise<ISkillDraftFile[]> {
    return (await window.qazinho?.attachToSkill(draftId)) ?? [];
  }

  public static async dropDraft(draftId: string): Promise<void> {
    await window.qazinho?.dropSkillDraft(draftId);
  }

  public static async write(request: IWriteSkill): Promise<SkillWritten> {
    return (
      (await window.qazinho?.writeSkill(request)) ?? {
        isAnswered: false,
        reason: 'failed',
        said: '',
      }
    );
  }

  public static async stop(draftId: string): Promise<void> {
    await window.qazinho?.stopSkill(draftId);
  }
}
