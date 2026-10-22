import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunQuestion } from '@/shared/types';

/** The run's agent asks the QA something: the run holds on the question until it ends, answered or not, or the run does. */
export function landAsked(props: {
  workspace: IWorkspace;
  question: IRunQuestion;
}): IWorkspace {
  const { workspace, question } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  return { ...workspace, live: { ...live, question: { ...question, waitedSec: 0 } } };
}
