import type { ISkill, ISkillDraftFile } from '@/shared/types';

/**
 * O que o editor abre: uma skill guardada, ou uma nova, em branco ou com o rascunho que
 * o agente escreveu e os arquivos que o QA anexou a ele.
 */
export interface ISkillEditing {
  skill: ISkill | null;
  draft: {
    name: string;
    description: string;
    body: string;
    draftId: string | null;
    files: ISkillDraftFile[];
  } | null;
}
