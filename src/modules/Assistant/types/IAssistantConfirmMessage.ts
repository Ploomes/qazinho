import type { ConfirmAction } from './ConfirmAction';
import type { ConfirmDecision } from './ConfirmDecision';

/** Something the assistant would remove, waiting for the QA on screen; `count` is how many workspaces go with a project. */
export interface IAssistantConfirmMessage {
  kind: 'confirm';
  id: string;
  action: ConfirmAction;
  subject: string;
  count: number;
  decision: ConfirmDecision | null;
}
