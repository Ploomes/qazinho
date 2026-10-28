import type { IWorkspace } from '@/modules/Workspace/types';
import type { IDraftedCase } from '@/shared/types';

/**
 * A exploração em andamento terminou: guarda o que o explorador disse do app e o plano
 * que ele sugere, para quando ela terminar.
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
