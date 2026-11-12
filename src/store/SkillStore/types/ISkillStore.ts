import type { ISkill } from '@/shared/types';

/** As skills do time como a página as conhece, lidas da main por último. */
export interface ISkillStore {
  skills: ISkill[];
  isLoaded: boolean;
  setSkills: (skills: ISkill[]) => void;
  landSkills: (skills: ISkill[]) => void;
  dropSkill: (id: string) => void;
}
