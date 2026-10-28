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

/**
 * Os projetos cuja parte compartilhada mudou entre dois momentos: um workspace novo,
 * sumido ou mudado no que o Pro guarda; o relógio de uma run viva não é mudança.
 */
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
