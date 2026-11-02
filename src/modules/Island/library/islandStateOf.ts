import type { IProject } from '@/modules/Project';
import type { IWorkspace } from '@/modules/Workspace';
import type { IslandState } from '@/shared/types';
import { flattenPlanSteps } from '@/modules/Run/library';

/**
 * O que a ilha mostra agora: as perguntas esperando o QA, da mais antiga à mais nova, e
 * sem nenhuma, a run que anda.
 */
export function islandStateOf(props: {
  workspaces: IWorkspace[];
  projects: IProject[];
}): IslandState {
  const live = props.workspaces.filter(({ live }) => live !== null && !live.isDone);
  const questions = live.flatMap((workspace) => {
    const question = workspace.live?.question;

    return question === undefined
      ? []
      : [
          {
            askedAtMs: question.askedAtMs,
            workspaceId: workspace.id,
            questionId: question.id,
            project:
              props.projects.find(({ id }) => id === workspace.projectId)?.name ?? '',
            workspace: workspace.name,
            question: question.question,
            options: question.options,
            isSecret: question.isSecret,
          },
        ];
  });

  if (questions.length > 0)
    return {
      kind: 'asking',
      questions: questions
        .sort((one, other) => one.askedAtMs - other.askedAtMs)
        .map(({ askedAtMs: _askedAtMs, ...question }) => question),
    };

  const [going] = live;

  if (going?.live === undefined || going.live === null) return { kind: 'idle' };

  const isExploring = going.live.kind === 'explore';
  const caseIds = going.live.caseIds;
  const steps = isExploring
    ? []
    : flattenPlanSteps(going.plan).filter(
        (step) => caseIds === undefined || caseIds.includes(step.caseId),
      );
  const done = going.live.outcomes.length;

  return {
    kind: 'running',
    workspaceId: going.id,
    name: going.name,
    detail: steps[done]?.action ?? '',
    done,
    total: steps.length,
    isExploring,
    isPaused: !going.live.isRunning,
  };
}
