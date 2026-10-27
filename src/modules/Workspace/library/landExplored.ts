import type { IWorkspace } from '@/modules/Workspace/types';
import type { IDraftedCase } from '@/shared/types';

/**
 * The exploration in flight finished: it keeps what the explorer said of the app and the
 * plan it suggests, for when it ends.
 */
export function landExplored(props: {
  workspace: IWorkspace;
  summary: string;
  cases: IDraftedCase[];
}): IWorkspace {
  const { workspace, summary, cases } = props;
  const { live } = workspace;

  if (!live || live.isDone || live.kind !== 'explore') return workspace;

  return { ...workspace, live: { ...live, suggestion: { summary, cases } } };
}
