import type { IQuestionAnswer, IQuestionsMessage } from '@/modules/Chat/types';
import type { IVariableBrief } from '@/shared/types';

export interface IQuestionRoundProps {
  message: IQuestionsMessage;
  isAnswerable: boolean;
  canAskStory?: boolean;
  onAnswer: (props: { messageId: string; answers: IQuestionAnswer[] }) => void;
  onVariables: (drafts: IVariableBrief[]) => Promise<string[] | null>;
}
