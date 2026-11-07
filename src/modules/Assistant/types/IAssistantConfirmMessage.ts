import type { ConfirmAction } from './ConfirmAction';
import type { ConfirmDecision } from './ConfirmDecision';

/**
 * Algo que o assistente removeria ou mandaria para fora, esperando pelo QA na tela;
 * `count` é quantos workspaces vão com um projeto, `detail` para onde um bug iria.
 */
export interface IAssistantConfirmMessage {
  kind: 'confirm';
  id: string;
  action: ConfirmAction;
  subject: string;
  count: number;
  detail?: string;
  decision: ConfirmDecision | null;
}
