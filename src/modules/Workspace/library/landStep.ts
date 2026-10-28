import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/shared/types';
import { catchBug } from '@/modules/Bug/library';
import { appendRunMessages } from '@/modules/Chat/library';

/**
 * Um passo voltou do dispositivo: o chat o acompanha, e uma falha cai no bug dela, já
 * aberto ou novo.
 */
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
        ? catchBug({ workspace, outcome, outcomes, isIncidental: false }).bugs
        : workspace.bugs,
    chat: appendRunMessages({ workspace, outcome, at }),
  };
}
