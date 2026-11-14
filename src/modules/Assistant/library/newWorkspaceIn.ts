import type { IProject, ITarget } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { TargetKind } from '@/shared/types';
import { toPlanKind } from '@/modules/Plan/library';
import { blankWorkspaceOf } from '@/modules/Workspace/library';

/**
 * Um workspace novo num projeto, com o plano vazio, no alvo pedido ou no único que o
 * projeto tem, ou por que não dá para criá-lo.
 */
export function newWorkspaceIn(props: {
  project: IProject;
  name: string;
  kind: TargetKind | undefined;
  now: number;
}):
  { isOk: true; workspace: IWorkspace; target: ITarget } | { isOk: false; text: string } {
  const { project, name, kind, now } = props;
  const kinds = project.targets.map((one) => one.kind).join(', ');
  const [only] = project.targets;
  const target =
    kind === undefined
      ? project.targets.length === 1
        ? only
        : undefined
      : project.targets.find((one) => one.kind === kind);

  if (target === undefined)
    return {
      isOk: false,
      text:
        kind === undefined
          ? `${project.id} tests on ${kinds}: say which target the workspace is for.`
          : `${project.id} has no ${kind} target. Its targets are ${kinds}.`,
    };

  return {
    isOk: true,
    target,
    workspace: {
      ...blankWorkspaceOf({ projectId: project.id, name, now }),
      targetId: target.id,
      planKind: toPlanKind(target.kind),
    },
  };
}
