import type { ISkillDraft } from './ISkillDraft';

/**
 * Uma mensagem do QA a quem escreve uma skill com ele: o rascunho, a sessão do agente, o
 * texto, e a skill como está quando ele muda uma.
 */
export interface IWriteSkill {
  draftId: string;
  agentId: string;
  model: string;
  sessionId: string | null;
  text: string;
  current: ISkillDraft | null;
}
