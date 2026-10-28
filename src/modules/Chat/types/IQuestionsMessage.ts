import type { IQuestionAnswer } from './IQuestionAnswer';
import type { IChatQuestion } from '@/shared/types';

/**
 * Uma rodada de perguntas que o agente fez ao QA, e as respostas dele depois que as
 * mandou.
 */
export interface IQuestionsMessage {
  id: string;
  kind: 'questions';
  at: string;
  questions: IChatQuestion[];
  answers: IQuestionAnswer[] | null;
}
