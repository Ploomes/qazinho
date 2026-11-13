import type {
  IHome,
  IHomeAnswered,
  IHomeArrived,
  IHomeAsking,
  IHomeChanged,
  IHomeByHand,
  IHomeDrafting,
  IHomeFailed,
  IHomePaused,
  IHomeRecent,
  IHomeRunning,
  IHomeToAnswer,
  IHomeToContinue,
  IHomeToDevelop,
  IHomeToPlan,
  ISprintRead,
} from '@/modules/Home/types';
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { openRoundOf } from '@/modules/Assistant/library';
import { changeNameOf, heldDoubtsOf } from '@/modules/Plan/library';
import {
  currentStepOf,
  manualWaitingOf,
  planStageOf,
  runToContinueOf,
} from '@/modules/Run/library';
import { workspaceMeta } from '@/modules/Workspace/library';

/**
 * O que o Início mostra: o que pede o QA em cada plano, as histórias da sprint sem plano,
 * e os planos abertos por último, os mais novos primeiro.
 */
export function homeOf(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
  developed: Record<string, string[]>;
  recent: { workspaceId: string; at: number }[];
  shown: number;
  unnamed: string;
  sprints: Record<string, ISprintRead>;
  planning: { queued: string[]; asking: string[] };
}): IHome {
  const asking: IHomeAsking[] = [];
  const toAnswer: IHomeToAnswer[] = [];
  const drafting: IHomeDrafting[] = [];
  const going: (IHomeRunning | IHomePaused)[] = [];
  const toContinue: IHomeToContinue[] = [];
  const failed: IHomeFailed[] = [];
  const arrived: IHomeArrived[] = [];
  const answered: IHomeAnswered[] = [];
  const changed: IHomeChanged[] = [];
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
    const round = live === null ? openRoundOf(workspace) : [];
    const isQueued = props.planning.queued.includes(workspace.id);
    const isDrafting =
      isQueued ||
      (props.planning.asking.includes(workspace.id) && workspace.plan.length === 0);

    if (round.length > 0)
      toAnswer.push({ ...base, kind: 'toAnswer', questions: round.length });
    else if (isDrafting && workspace.issue !== null)
      drafting.push({ ...base, kind: 'drafting', key: workspace.issue.key, isQueued });

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

    const sources = (workspace.changed?.found ?? []).map(changeNameOf);
    const toReview = (workspace.review?.items ?? []).filter(
      ({ state }) => state === 'open',
    ).length;

    if (live === null && (sources.length > 0 || toReview > 0))
      changed.push({ ...base, kind: 'changed', sources, toReview });

    if (live === null && held.length > 0)
      answered.push({ ...base, kind: 'answered', ids: held.map(({ id }) => id) });

    if (live === null && developed !== undefined && !isArrived) {
      const cases = planStageOf({ plan: workspace.plan, developed }).toDevelop.length;

      if (cases > 0) toDevelop.push({ ...base, kind: 'toDevelop', cases });
    }
  }

  return {
    asking,
    toAnswer,
    going,
    toContinue,
    failed,
    arrived,
    answered,
    changed,
    byHand,
    toDevelop,
    drafting,
    toPlan: toPlanOf(props),
    recent: recentOf(props).slice(0, props.shown),
  };
}

function toPlanOf(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
  sprints: Record<string, ISprintRead>;
}): IHomeToPlan[] {
  return props.projects.flatMap((project) => {
    const read = props.sprints[project.id];
    const planned = new Set(
      props.workspaces.flatMap((workspace) =>
        workspace.projectId === project.id && workspace.issue !== null
          ? [workspace.issue.key]
          : [],
      ),
    );

    if (read === undefined || read.sprint === null) return [];

    const sprint = read.sprint;

    return read.stories
      .filter(({ key }) => !planned.has(key))
      .map((story) => ({
        ...story,
        kind: 'toPlan' as const,
        projectId: project.id,
        project: project.name,
        sprint,
      }));
  });
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
