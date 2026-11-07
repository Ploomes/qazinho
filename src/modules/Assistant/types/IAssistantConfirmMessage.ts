import type { ConfirmAction } from './ConfirmAction';
import type { ConfirmDecision } from './ConfirmDecision';

/**
 * O que o assistente ou o agente de código do QA (`from`) mudaria, removeria ou mandaria
 * para fora, esperando pelo QA.
 */
export interface IAssistantConfirmMessage {
  kind: 'confirm';
  id: string;
  action: ConfirmAction;
  subject: string;
  count: number;
  detail?: string;
  decision: ConfirmDecision | null;
  from?: 'outside';
}
