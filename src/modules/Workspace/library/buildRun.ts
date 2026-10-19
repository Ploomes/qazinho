import type { IRun, IRunCase, IRunStep, RunEnd } from '@/modules/Run';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/shared/types';
import { caseVerdict, countVerdicts } from '@/modules/Run/library';

const MS_IN_SECOND = 1_000;

function tookSec(outcomes: IStepOutcome[]): number {
  return Math.round(
    outcomes.reduce((total, one) => total + one.tookMs, 0) / MS_IN_SECOND,
  );
}

/** The run as it ended, read back from what the device actually did. */
export function buildRun(props: { workspace: IWorkspace; endedBy: RunEnd }): IRun {
  const { workspace, endedBy } = props;
  const live = workspace.live;
  const outcomes = live?.outcomes ?? [];
  const id = live?.id ?? 'r-01';

  const cases: IRunCase[] = workspace.plan
    .map((testCase) => {
      const mine = outcomes.filter((outcome) => outcome.caseId === testCase.id);

      const steps: IRunStep[] = mine.map((outcome) => ({
        number: outcome.stepNumber,
        action: outcome.action,
        verdict: outcome.verdict,
        why: outcome.why.length > 0 ? outcome.why : null,
        shot: outcome.screenshot,
        shotFile: outcome.shotFile,
        span: { from: outcome.at - outcome.tookMs, to: outcome.at },
        bugId:
          [...workspace.bugs]
            .sort((one, other) => Number(one.isIncidental) - Number(other.isIncidental))
            .find(
              (bug) =>
                bug.runId === id &&
                bug.caseId === outcome.caseId &&
                bug.stepNumber === outcome.stepNumber,
            )?.id ?? null,
      }));

      return {
        id: testCase.id,
        title: testCase.title,
        verdict: caseVerdict(steps),
        durationSec: tookSec(mine),
        steps,
      };
    })
    .filter((testCase) => testCase.steps.length > 0);

  return {
    id,
    meta: workspace.name,
    startedAt: live?.startedAt ?? '',
    durationSec: live?.elapsedSec ?? tookSec(outcomes),
    costUsd: live?.costUsd ?? null,
    counts: countVerdicts(outcomes.map((outcome) => outcome.verdict)),
    cases,
    endedBy,
    video: null,
  };
}
