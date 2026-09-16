import type { IWorkspace } from '@/modules/Workspace/types';

export function mapWorkspace(props: {
  workspaces: IWorkspace[];
  workspaceId: string;
  change: (workspace: IWorkspace) => IWorkspace;
}): IWorkspace[] {
  const { workspaces, workspaceId, change } = props;

  return workspaces.map((workspace) =>
    workspace.id === workspaceId ? change(workspace) : workspace,
  );
}
