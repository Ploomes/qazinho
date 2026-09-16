import type { IRun, IRunCase, IRunStep, StepVerdict } from '@/modules/Run/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { countVerdicts, flattenPlanSteps } from '@/modules/Run/library';

export function buildRun(props: { workspace: IWorkspace; runNumber: number }): IRun {
  const { workspace, runNumber } = props;
  const verdicts = workspace.live?.verdicts ?? [];
  const steps = flattenPlanSteps(workspace.plan);

  const cases = workspace.plan.reduce<IRunCase[]>((collected, testCase) => {
    const runSteps = steps.reduce<IRunStep[]>((forCase, step, index) => {
      if (step.caseId !== testCase.id) return forCase;

      const verdict: StepVerdict = verdicts[index] ?? 'skipped';

      return [
        ...forCase,
        {
          number: step.numberInCase,
          action: step.action,
          verdict,
          why:
            verdict === 'skipped' ? 'Skipped because the step before it failed.' : null,
          bugId: null,
        },
      ];
    }, []);

    const hasFailure = runSteps.some(({ verdict }) => verdict === 'failed');

    return [
      ...collected,
      {
        id: testCase.id,
        title: testCase.title,
        verdict: hasFailure ? 'failed' : 'passed',
        durationSec: runSteps.length * 2,
        steps: runSteps,
      },
    ];
  }, []);

  return {
    id: `r-${String(runNumber).padStart(2, '0')}`,
    title: `Run r-${String(runNumber).padStart(2, '0')} · the whole plan`,
    what: 'The whole plan',
    meta: workspace.name,
    startedAt: workspace.live?.startedAt ?? '',
    durationSec: workspace.live?.elapsedSec ?? 0,
    counts: countVerdicts(verdicts),
    cases,
  };
}
