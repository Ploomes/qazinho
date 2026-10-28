import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunQuestion } from '@/shared/types';

/**
 * O agente da run pergunta algo ao QA: a run segura na pergunta até ela terminar,
 * respondida ou não, ou até a run terminar.
 */
export function landAsked(props: {
  workspace: IWorkspace;
  question: IRunQuestion;
}): IWorkspace {
  const { workspace, question } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  return { ...workspace, live: { ...live, question: { ...question, waitedSec: 0 } } };
}
