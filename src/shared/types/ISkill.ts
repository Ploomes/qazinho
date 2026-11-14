import type { SkillSource } from './SkillSource';
import type { SkillUse } from './SkillUse';

/**
 * Uma skill do time no QAzinho: o nome, quando usar, as instruções, os arquivos ao lado,
 * onde vale, em quais projetos (nenhuma lista é todos) e de onde veio.
 */
export interface ISkill {
  id: string;
  name: string;
  description: string;
  body: string;
  files: string[];
  use: SkillUse;
  projectIds: string[] | null;
  isOn: boolean;
  source: SkillSource;
  updatedAt: string;
}
