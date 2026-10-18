import type { IQuestionAnswer } from './IQuestionAnswer';
import type { IChatQuestion } from '@/shared/types';

/** A round of questions the agent asked the QA, and their answers once they sent them. */
export interface IQuestionsMessage {
  id: string;
  kind: 'questions';
  at: string;
  questions: IChatQuestion[];
  answers: IQuestionAnswer[] | null;
}
