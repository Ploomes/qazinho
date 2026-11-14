import type { ISaveSkill, ISkillImport, SkillSaved } from '@/shared/types';
import { Skills } from '@/services';
import { useSkillStore } from '@/store';

export const useSkillActions = () => {
  const setSkills = useSkillStore((state) => state.setSkills);
  const landSkills = useSkillStore((state) => state.landSkills);
  const dropSkill = useSkillStore((state) => state.dropSkill);

  return {
    load: async () => {
      setSkills(await Skills.list());
    },
    refresh: async () => {
      setSkills(await Skills.refresh());
    },
    save: async (skill: ISaveSkill): Promise<SkillSaved> => {
      const saved = await Skills.save(skill);

      if (saved.isSaved) landSkills([saved.skill]);

      return saved;
    },
    remove: async (id: string) => {
      await Skills.remove(id);
      dropSkill(id);
    },
    importSkills: async (request: ISkillImport) => {
      const imported = await Skills.import(request);

      landSkills(imported);

      return imported;
    },
    importFile: async () => {
      const imported = await Skills.importFile();

      landSkills(imported);

      return imported;
    },
  };
};
