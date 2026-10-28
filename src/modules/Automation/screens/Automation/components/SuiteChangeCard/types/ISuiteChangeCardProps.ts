import type { ISuiteChange, SuiteChangeNote } from '@/modules/Automation/types';

/**
 * Uma mudança que o agente fez para o teste escolhido, como está, o que o agente disse
 * enquanto isso e o nome dele, e o que o QA pode fazer com ela.
 */
export interface ISuiteChangeCardProps {
  change: ISuiteChange;
  notes: SuiteChangeNote[];
  agent: string;
  onStop: () => void;
  onReview: () => void;
  onDiscard: () => void;
  onRetry: () => void;
}
