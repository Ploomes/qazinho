import type { IWorkspace } from '@/modules/Workspace/types';
import { RUN_ENGINE } from '@/modules/Run/constants';
import { flattenPlanSteps, verdictForStep } from '@/modules/Run/library';
import { buildRun } from './buildRun';

/** One tick of the mock engine. A step resolves every third tick; the last one closes the run. */
export function advanceRun(workspace: IWorkspace): IWorkspace {
  const { live } = workspace;

  if (!live || !live.isRunning || live.isDone) return workspace;

  const ticked = {
    ...live,
    ticks: live.ticks + 1,
    elapsedSec: live.elapsedSec + RUN_ENGINE.tickSeconds,
  };

  if (ticked.ticks % RUN_ENGINE.ticksPerStep !== 0) return { ...workspace, live: ticked };

  const steps = flattenPlanSteps(workspace.plan);
  const position = live.stepIndex + 1;
  const resolved = {
    ...ticked,
    stepIndex: position,
    verdicts: [...live.verdicts, verdictForStep(position)],
  };

  if (position < steps.length) return { ...workspace, live: resolved };

  const finished = {
    ...workspace,
    live: { ...resolved, isRunning: false, isDone: true },
  };
  const run = buildRun({ workspace: finished, runNumber: workspace.runs.length + 1 });

  return {
    ...finished,
    runs: [run, ...workspace.runs],
    status: run.counts.failed > 0 ? 'failed' : 'passed',
  };
}
