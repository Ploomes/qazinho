import type { IWorkspace } from '@/modules/Workspace/types';

/** O chat que conta o nome de um projeto: o aberto, se é dele, senão o primeiro dele. */
export function namingWorkspaceOf(props: {
  workspaces: IWorkspace[];
  projectId: string;
  selectedId: string | null;
}): string | null {
  const own = props.workspaces.filter(({ projectId }) => projectId === props.projectId);

  return (own.find(({ id }) => id === props.selectedId) ?? own[0])?.id ?? null;
}
