import type { ChatMessage, IQuestionAnswer } from '@/modules/Chat/types';
import type { IVariableBrief } from '@/shared/types';

/**
 * Uma mensagem no chat, com quem a disse e quando, e o que o QA pode fazer com ela;
 * `isNested` a põe dentro da caixa de uma run, `isFollowUp` a junta à fala de antes.
 */
export interface IChatRowProps {
  message: ChatMessage;
  isNew: boolean;
  isAnswerable: boolean;
  canAskStory?: boolean;
  isFollowUp?: boolean;
  who?: string;
  onAnswerQuestions: (props: { messageId: string; answers: IQuestionAnswer[] }) => void;
  onOpenPlan: () => void;
  onTakeSuggestion: (props: { messageId: string; only: number[] }) => void;
  onVariables: (drafts: IVariableBrief[]) => Promise<string[] | null>;
  onOpenBug: (bugId: string) => void;
  isNested?: boolean;
  isRetryable?: boolean;
  onRetry?: () => void;
}
