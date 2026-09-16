import type { ChatMessage } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/types';

/** A step that did not hold up gets a verdict in the chat; the rest of the run is read in Runs. */
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
      at,
      verdict: outcome.verdict,
      text: `Step ${String(outcome.stepNumber)} ${outcome.verdict} · ${outcome.action}`,
      expected: outcome.expected,
      got: outcome.got.length > 0 ? outcome.got : outcome.why,
    },
  ];
}
