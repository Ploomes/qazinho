import type { ISuiteChange, SuiteChangeNote } from '@/modules/Automation/types';

/**
 * Um teste novo pedido ao agente, escolhido: o pedido, o que o agente fez enquanto isso e
 * o nome dele, e o que o QA pode fazer com ele.
 */
export interface ISuiteRequestPaneProps {
  change: ISuiteChange;
  notes: SuiteChangeNote[];
  agent: string;
  onStop: () => void;
  onReview: () => void;
  onDiscard: () => void;
  onRetry: () => void;
}
