import type { ChatMessage, IQuestionAnswer } from '@/modules/Chat/types';

/** One message in the chat, with who said it and when, and what the QA can do with it. */
export interface IChatRowProps {
  message: ChatMessage;
  isNew: boolean;
  isAnswerable: boolean;
  onAnswer: (reply: string) => void;
  onAnswerQuestions: (props: { messageId: string; answers: IQuestionAnswer[] }) => void;
  onOpenPlan: () => void;
  onOpenBug: (bugId: string) => void;
}
