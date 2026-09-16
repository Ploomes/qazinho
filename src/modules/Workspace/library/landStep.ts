import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/types';
import { makeBug } from '@/modules/Bug/library';
import { appendRunMessages } from '@/modules/Chat/library';

/** One step came back from the device: the chat follows it, and a failure becomes a bug. */
export function landStep(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
  at: string;
}): IWorkspace {
  const { workspace, outcome, at } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  const outcomes = [...live.outcomes, outcome];

  return {
    ...workspace,
    live: {
      ...live,
      outcomes,
      doingIndex: -1,
      shot: outcome.screenshot ?? live.shot,
    },
    bugs:
      outcome.verdict === 'failed'
        ? [...workspace.bugs, makeBug({ workspace, outcome, outcomes })]
        : workspace.bugs,
    chat: appendRunMessages({ workspace, outcome, at }),
  };
}
