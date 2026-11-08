import type { IProject, ITarget } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IProSyncBatch } from '@/shared/types';
import { sharedValueOf } from './sharedValueOf';
import { syncedBugOf } from './syncedBugOf';
import { syncedCaseOf } from './syncedCaseOf';
import { syncedRunOf } from './syncedRunOf';

/**
 * Tudo o que um projeto compartilhado guarda, como o QAzinho Pro o aceita: cada workspace
 * com um plano, uma run ou um bug como um plano, com as runs terminadas e os bugs dele.
 */
export function proBatchOf(props: {
  project: IProject;
  workspaces: IWorkspace[];
}): IProSyncBatch {
  const { project, workspaces } = props;
  const kept = workspaces.flatMap((workspace) => {
    const target = project.targets.find(({ id }) => id === workspace.targetId);
    const isEmpty =
      workspace.plan.length === 0 &&
      workspace.runs.length === 0 &&
      workspace.bugs.length === 0;

    return workspace.projectId !== project.id || target === undefined || isEmpty
      ? []
      : [{ workspace, target: sharedTargetOf(target) }];
  });

  return {
    project: {
      projectId: project.id,
      name: project.name,
      targets: project.targets.map(sharedTargetOf),
      repositories: project.repositories.map(({ id, owner, name, baseBranch }) => ({
        id,
        owner,
        name,
        baseBranch,
      })),
    },
    plans: kept.map(({ workspace, target }) => ({
      workspaceId: workspace.id,
      name: workspace.name,
      targetId: target.id,
      targetKind: target.kind,
      issue: workspace.issue,
      design: workspace.design,
      cases: workspace.plan.map(syncedCaseOf),
    })),
    runs: kept.flatMap(({ workspace, target }) =>
      workspace.runs.flatMap((run) => {
        const synced = syncedRunOf({ workspaceId: workspace.id, run, target });

        return synced === null ? [] : [synced];
      }),
    ),
    bugs: kept.flatMap(({ workspace }) =>
      workspace.bugs.flatMap((bug) => {
        const synced = syncedBugOf({
          workspaceId: workspace.id,
          bug,
          runs: workspace.runs,
        });

        return synced === null ? [] : [synced];
      }),
    ),
    memories: project.memories ?? [],
  };
}

function sharedTargetOf(target: ITarget): ITarget {
  return { ...target, value: sharedValueOf(target.value) };
}
