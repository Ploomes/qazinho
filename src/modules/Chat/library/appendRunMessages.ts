import type { ChatMessage } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IStepOutcome } from '@/shared/types';

/**
 * A step that did not hold up gets a verdict in the chat; the rest of the run is read in
 * Runs.
 */
export function appendRunMessages(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
  at: string;
}): ChatMessage[] {
  const { workspace, outcome, at } = props;
  const { chat } = workspace;

  if (outcome.verdict === 'passed' || outcome.verdict === 'skipped') return chat;

  return [
    ...chat,
    {
      id: `m-${String(chat.length + 1)}`,
      kind: 'verdict',
      runId: workspace.live?.id ?? null,
      at,
      verdict: outcome.verdict,
      stepNumber: outcome.stepNumber,
      action: outcome.action,
      expected: outcome.expected,
      got: outcome.got.length > 0 ? outcome.got : outcome.why,
    },
  ];
}
