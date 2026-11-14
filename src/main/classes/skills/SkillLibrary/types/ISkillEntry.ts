import type { SkillSource, SkillUse } from '@/shared/types';

/**
 * O que o índice guarda de uma skill além do SKILL.md dela: onde vale, em quais projetos,
 * se está ligada, de onde veio, os arquivos e quando mudou.
 */
export interface ISkillEntry {
  id: string;
  use: SkillUse;
  projectIds: string[] | null;
  isOn: boolean;
  source: SkillSource;
  files: string[];
  updatedAt: string;
}
