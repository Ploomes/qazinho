import type { IWorkspace } from '@/modules/Workspace/types';

const SHARED_PARTS = [
  'projectId',
  'name',
  'targetId',
  'issue',
  'design',
  'plan',
  'runs',
  'bugs',
] as const satisfies readonly (keyof IWorkspace)[];

/** The projects whose shared part changed between two moments: a workspace added, gone, or changed in what QAzinho Pro keeps; a live run's clock is no change. */
export function changedProjectsOf(props: {
  workspaces: IWorkspace[];
  before: IWorkspace[];
}): string[] {
  const { workspaces, before } = props;
  const changed = new Set<string>();

  for (const workspace of workspaces) {
    const was = before.find(({ id }) => id === workspace.id);

    if (was !== undefined && SHARED_PARTS.every((part) => was[part] === workspace[part]))
      continue;

    changed.add(workspace.projectId);

    if (was !== undefined) changed.add(was.projectId);
  }

  for (const was of before)
    if (!workspaces.some(({ id }) => id === was.id)) changed.add(was.projectId);

  return [...changed];
}
