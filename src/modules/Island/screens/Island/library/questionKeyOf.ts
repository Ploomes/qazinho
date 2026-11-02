import type { IIslandQuestion } from '@/shared/types';

/** O que identifica uma pergunta na ilha, já que dois workspaces podem repetir um id. */
export function questionKeyOf(question: IIslandQuestion): string {
  return `${question.workspaceId}/${question.questionId}`;
}
