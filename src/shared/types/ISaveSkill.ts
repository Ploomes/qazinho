import type { SkillUse } from './SkillUse';

/**
 * Uma skill como a página a manda guardar: uma nova sem id, ou as mudanças numa que
 * existe; os arquivos de um rascunho vão junto quando ele vira skill.
 */
export interface ISaveSkill {
  id: string | null;
  name: string;
  description: string;
  body: string;
  use: SkillUse;
  projectIds: string[] | null;
  isOn: boolean;
  draftId: string | null;
}
