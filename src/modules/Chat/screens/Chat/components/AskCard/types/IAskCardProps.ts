import type { ILiveQuestion } from '@/modules/Workspace';
import type { QaReply } from '@/shared/types';

/** The question a run's agent waits on, and where the QA's reply goes. */
export interface IAskCardProps {
  question: ILiveQuestion;
  onAnswer: (reply: QaReply) => void;
}
