import type { IQuestionAnswer, IQuestionsMessage } from '@/modules/Chat/types';

export interface IQuestionRoundProps {
  message: IQuestionsMessage;
  isAnswerable: boolean;
  onAnswer: (props: { messageId: string; answers: IQuestionAnswer[] }) => void;
}
