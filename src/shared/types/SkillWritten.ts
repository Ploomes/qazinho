import type { ISkillDraftAnswer } from './ISkillDraftAnswer';

/**
 * O que quem escreve a skill respondeu, com a sessão para a próxima mensagem, ou por que
 * não respondeu.
 */
export type SkillWritten =
  | { isAnswered: true; sessionId: string | null; answer: ISkillDraftAnswer }
  | { isAnswered: false; reason: 'agent-missing' | 'stopped' | 'failed'; said: string };
