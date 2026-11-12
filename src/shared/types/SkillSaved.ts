import type { ISkill } from './ISkill';

/**
 * Uma skill guardada, ou por que não: sem nome, sem quando usar, sem instruções, grande
 * demais, ou um nome que outra skill já tem.
 */
export type SkillSaved =
  | { isSaved: true; skill: ISkill }
  | {
      isSaved: false;
      reason: 'no-name' | 'no-description' | 'no-body' | 'too-large' | 'taken';
    };
