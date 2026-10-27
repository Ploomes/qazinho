import type { IProject, ITarget } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IProSyncBatch } from '@/shared/types';
import { sharedValueOf } from './sharedValueOf';
import { syncedBugOf } from './syncedBugOf';
import { syncedCaseOf } from './syncedCaseOf';
import { syncedRunOf } from './syncedRunOf';

/**
 * Everything a shared project holds, as QAzinho Pro takes it: each workspace with a plan,
 * a run or a bug as a plan, with its finished runs and its bugs.
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
      repositories: project.repositories.map(({ owner, name, baseBranch }) => ({
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
  };
}

function sharedTargetOf(target: ITarget): ITarget {
  return { ...target, value: sharedValueOf(target.value) };
}
