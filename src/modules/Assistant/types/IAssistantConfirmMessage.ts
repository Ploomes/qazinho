import type { ConfirmAction } from './ConfirmAction';
import type { ConfirmDecision } from './ConfirmDecision';

/** Something the assistant would remove or send out, waiting for the QA on screen; `count` is how many workspaces go with a project, `detail` where a bug would go. */
export interface IAssistantConfirmMessage {
  kind: 'confirm';
  id: string;
  action: ConfirmAction;
  subject: string;
  count: number;
  detail?: string;
  decision: ConfirmDecision | null;
}
