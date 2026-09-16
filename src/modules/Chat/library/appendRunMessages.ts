import type { ChatMessage } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/types';

const ACTIONS_KEPT = 5;

/** The chat follows the run: the actions roll, and a failure gets its own verdict. */
export function appendRunMessages(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
  at: string;
}): ChatMessage[] {
  const { workspace, outcome, at } = props;
  const chat = workspace.chat.filter((message) => message.kind !== 'action');
  const log = workspace.chat.find((message) => message.kind === 'action');

  const actions = [...(log?.actions ?? []), { what: outcome.action, at }].slice(
    -ACTIONS_KEPT,
  );

  const rolled: ChatMessage = {
    id: log?.id ?? `m-${String(chat.length + 1)}`,
    kind: 'action',
    at,
    actions,
  };

  if (outcome.verdict === 'passed' || outcome.verdict === 'skipped')
    return [...chat, rolled];

  return [
    ...chat,
    rolled,
    {
      id: `m-${String(chat.length + 2)}`,
      kind: 'verdict',
      at,
      verdict: outcome.verdict,
      text: `Step ${String(outcome.stepNumber)} ${outcome.verdict} · ${outcome.action}`,
      expected: outcome.expected,
      got: outcome.got.length > 0 ? outcome.got : outcome.why,
    },
  ];
}
