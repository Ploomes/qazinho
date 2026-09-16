import type { IWorkspace } from '@/modules/Workspace/types';
import { makeBug } from '@/modules/Bug/library';
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
  const verdict = verdictForStep(position);
  const resolved = {
    ...ticked,
    stepIndex: position,
    verdicts: [...live.verdicts, verdict],
  };

  const step = steps[position - 1];
  const caught =
    verdict === 'failed' && step
      ? [...workspace.bugs, makeBug({ workspace, step })]
      : workspace.bugs;

  const walked = { ...workspace, bugs: caught, live: resolved };

  if (position < steps.length) return walked;

  const finished = { ...walked, live: { ...resolved, isRunning: false, isDone: true } };
  const run = buildRun({ workspace: finished, runNumber: workspace.runs.length + 1 });

  return {
    ...finished,
    runs: [run, ...workspace.runs],
    status: run.counts.failed > 0 ? 'failed' : 'passed',
  };
}
