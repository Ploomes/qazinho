import type { ChatMessage } from '@/modules/Chat/types';
import type { IFlatStep, StepVerdict } from '@/modules/Run/types';
import type { IWorkspace } from '@/modules/Workspace/types';

const ACTIONS_KEPT = 5;

/** The chat follows the run: the actions roll, and a failure gets its own verdict. */
export function appendRunMessages(props: {
  workspace: IWorkspace;
  step: IFlatStep;
  verdict: StepVerdict;
  at: string;
}): ChatMessage[] {
  const { workspace, step, verdict, at } = props;
  const chat = workspace.chat.filter((message) => message.kind !== 'action');
  const log = workspace.chat.find((message) => message.kind === 'action');

  const actions = [...(log?.actions ?? []), { what: step.action, at }].slice(
    -ACTIONS_KEPT,
  );

  const rolled: ChatMessage = {
    id: log?.id ?? `m-${String(chat.length + 1)}`,
    kind: 'action',
    at,
    actions,
  };

  if (verdict !== 'failed') return [...chat, rolled];

  return [
    ...chat,
    rolled,
    {
      id: `m-${String(chat.length + 2)}`,
      kind: 'verdict',
      at,
      verdict,
      text: `Step ${String(step.numberInCase)} failed · ${step.action}`,
      expected: step.expected,
      got: 'The step did not do what the plan asked for.',
    },
  ];
}
