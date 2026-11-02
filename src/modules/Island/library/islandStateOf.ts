import type { IWorkspace } from '@/modules/Workspace';
import type { IslandState } from '@/shared/types';
import { flattenPlanSteps } from '@/modules/Run/library';

/**
 * O que a ilha mostra do que anda agora: o agente esperando o QA vem antes de uma run
 * andando, e sem nenhum dos dois não há nada a mostrar.
 */
export function islandStateOf(workspaces: IWorkspace[]): IslandState {
  const live = workspaces.filter(({ live }) => live !== null && !live.isDone);
  const asking = live.find(({ live }) => live?.question !== undefined);

  if (asking?.live?.question !== undefined)
    return {
      kind: 'asking',
      workspaceId: asking.id,
      name: asking.name,
      question: asking.live.question.question,
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
