import type { ILiveQuestion } from '@/modules/Workspace';
import type { QaReply } from '@/shared/types';

/** A pergunta que o agente de uma run espera, e para onde vai a resposta do QA. */
export interface IAskCardProps {
  question: ILiveQuestion;
  onAnswer: (reply: QaReply) => void;
}
