import type { ChatMessage, IQuestionAnswer } from '@/modules/Chat/types';
import type { IVariableBrief } from '@/shared/types';

/** One message in the chat, with who said it and when, and what the QA can do with it; `isNested` lays it out inside a run's box. */
export interface IChatRowProps {
  message: ChatMessage;
  isNew: boolean;
  isAnswerable: boolean;
  onAnswerQuestions: (props: { messageId: string; answers: IQuestionAnswer[] }) => void;
  onOpenPlan: () => void;
  onTakeSuggestion: (messageId: string) => void;
  onVariables: (drafts: IVariableBrief[]) => Promise<string[] | null>;
  onOpenBug: (bugId: string) => void;
  isNested?: boolean;
}
