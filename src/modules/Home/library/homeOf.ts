import type {
  IHome,
  IHomeAnswered,
  IHomeArrived,
  IHomeAsking,
  IHomeByHand,
  IHomeFailed,
  IHomePaused,
  IHomeRecent,
  IHomeRunning,
  IHomeToContinue,
  IHomeToDevelop,
} from '@/modules/Home/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { heldDoubtsOf } from '@/modules/Plan/library';
import {
  currentStepOf,
  manualWaitingOf,
  planStageOf,
  runToContinueOf,
} from '@/modules/Run/library';
import { workspaceMeta } from '@/modules/Workspace/library';

/**
 * O que o Início mostra: em cada plano de cada projeto, o que pede o QA agora, e os
 * planos abertos por último, os mais novos primeiro.
 */
export function homeOf(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
  developed: Record<string, string[]>;
  recent: { workspaceId: string; at: number }[];
  shown: number;
  unnamed: string;
}): IHome {
  const asking: IHomeAsking[] = [];
  const going: (IHomeRunning | IHomePaused)[] = [];
  const toContinue: IHomeToContinue[] = [];
  const failed: IHomeFailed[] = [];
  const arrived: IHomeArrived[] = [];
  const answered: IHomeAnswered[] = [];
  const byHand: IHomeByHand[] = [];
  const toDevelop: IHomeToDevelop[] = [];

  for (const workspace of props.workspaces) {
    const project = props.projects.find(({ id }) => id === workspace.projectId);

    if (project === undefined) continue;

    const base = {
      workspaceId: workspace.id,
      plan: workspace.name === '' ? props.unnamed : workspace.name,
      project: project.name,
    };
    const live =
      workspace.live !== null && !workspace.live.isDone ? workspace.live : null;
    const developed = props.developed[workspace.id];

    if (live?.question !== undefined)
      asking.push({ ...base, kind: 'asking', question: live.question.question });
    else if (live?.isRunning === true) going.push(runningOf({ base, workspace }));
    else if (live !== null) going.push({ ...base, kind: 'paused' });
    else {
      const left = runToContinueOf({ plan: workspace.plan, runs: workspace.runs });

      if (left !== null)
        toContinue.push({ ...base, kind: 'toContinue', cases: left.caseIds.length });
      else if (workspace.status === 'failed')
        failed.push({
          ...base,
          kind: 'failed',
          failed: workspace.runs[0]?.counts.failed ?? 0,
          bugs: workspace.bugs.filter(
            ({ isDismissed, filed }) => !isDismissed && filed === null,
          ).length,
        });
    }

    const [waiting, ...more] =
      live === null
        ? manualWaitingOf({ plan: workspace.plan, runs: workspace.runs })
        : [];

    if (waiting !== undefined)
      byHand.push({ ...base, kind: 'byHand', cases: more.length + 1, caseId: waiting });

    const held = heldDoubtsOf({ plan: workspace.plan, doubts: workspace.doubts ?? [] });
    const isArrived =
      live === null && workspace.storyStage === 'arrived' && workspace.issue !== null;

    if (isArrived && workspace.issue !== null)
      arrived.push({ ...base, kind: 'arrived', key: workspace.issue.key });

    if (live === null && held.length > 0)
      answered.push({ ...base, kind: 'answered', ids: held.map(({ id }) => id) });

    if (live === null && developed !== undefined && !isArrived) {
      const cases = planStageOf({ plan: workspace.plan, developed }).toDevelop.length;

      if (cases > 0) toDevelop.push({ ...base, kind: 'toDevelop', cases });
    }
  }

  return {
    asking,
    going,
    toContinue,
    failed,
    arrived,
    answered,
    byHand,
    toDevelop,
    recent: recentOf(props).slice(0, props.shown),
  };
}

function runningOf(props: {
  base: { workspaceId: string; plan: string; project: string };
  workspace: IWorkspace;
}): IHomeRunning {
  const { base, workspace } = props;
  const isExplore = workspace.live?.kind === 'explore';
  const total = workspaceMeta(workspace).count;

  return {
    ...base,
    kind: 'running',
    how: workspace.live?.how ?? null,
    isExplore,
    current: isExplore
      ? total
      : currentStepOf({ walked: workspace.live?.outcomes.length ?? 0, total }),
    total,
  };
}

function recentOf(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
  recent: { workspaceId: string; at: number }[];
  unnamed: string;
}): IHomeRecent[] {
  return props.recent.flatMap(({ workspaceId, at }) => {
    const workspace = props.workspaces.find(({ id }) => id === workspaceId);
    const project = props.projects.find(({ id }) => id === workspace?.projectId);

    return workspace === undefined || project === undefined
      ? []
      : [
          {
            workspaceId,
            plan: workspace.name === '' ? props.unnamed : workspace.name,
            projectId: project.id,
            project: project.name,
            at,
          },
        ];
  });
}
