import type {
  IFlatStep,
  IRun,
  IRunCase,
  IRunStep,
  StepVerdict,
} from '@/modules/Run/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { countVerdicts, flattenPlanSteps } from '@/modules/Run/library';

type ResolvedStep = IFlatStep & { verdict: StepVerdict };

export function buildRun(props: { workspace: IWorkspace; runNumber: number }): IRun {
  const { workspace, runNumber } = props;
  const verdicts = workspace.live?.verdicts ?? [];

  const resolved: ResolvedStep[] = flattenPlanSteps(workspace.plan).map(
    (step, index) => ({
      ...step,
      verdict: verdicts[index] ?? 'skipped',
    }),
  );

  const cases: IRunCase[] = workspace.plan.map((testCase) => {
    const steps: IRunStep[] = resolved
      .filter((step) => step.caseId === testCase.id)
      .map((step) => ({
        number: step.numberInCase,
        action: step.action,
        verdict: step.verdict,
        why:
          step.verdict === 'skipped'
            ? 'Skipped because the step before it failed.'
            : null,
        bugId: null,
      }));

    return {
      id: testCase.id,
      title: testCase.title,
      verdict: steps.some((step) => step.verdict === 'failed') ? 'failed' : 'passed',
      durationSec: steps.length * 2,
      steps,
    };
  });

  const id = `r-${String(runNumber).padStart(2, '0')}`;

  return {
    id,
    title: `Run ${id} · the whole plan`,
    what: 'The whole plan',
    meta: workspace.name,
    startedAt: workspace.live?.startedAt ?? '',
    durationSec: workspace.live?.elapsedSec ?? 0,
    counts: countVerdicts(verdicts),
    cases,
  };
}
