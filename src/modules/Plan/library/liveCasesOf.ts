import type { ILiveCase, ITestCase } from '@/modules/Plan/types';
import type { IRunStep } from '@/modules/Run/types';
import type { ILiveRun } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/shared/types';
import { caseVerdict } from '@/modules/Run/library/caseVerdict';
import { walkedStepsOf } from '@/modules/Run/library/walkedStepsOf';

/**
 * Como cada caso de uma run em andamento está: o que ela já andou nele, e em qual ela
 * está agora; uma exploração ou uma run que acabou não muda nenhum.
 */
export function liveCasesOf(props: {
  plan: ITestCase[];
  live: Pick<
    ILiveRun,
    'outcomes' | 'doingIndex' | 'caseIds' | 'isDone' | 'isRunning' | 'question' | 'kind'
  > | null;
}): Record<string, ILiveCase> {
  const { plan, live } = props;

  if (live === null || live.isDone || live.kind === 'explore') return {};

  const walked = walkedStepsOf({ plan, caseIds: live.caseIds });
  const doing = walked[live.doingIndex] ?? null;
  const lastCaseId = live.outcomes.at(-1)?.caseId ?? null;
  const nowStatus =
    live.question !== undefined ? 'attention' : live.isRunning ? 'running' : 'paused';

  return Object.fromEntries(
    plan
      .filter(({ id }) => walked.some(({ caseId }) => caseId === id))
      .map((testCase) => {
        const count = walked.filter(({ caseId }) => caseId === testCase.id).length;
        const steps = live.outcomes
          .filter(({ caseId }) => caseId === testCase.id)
          .map(stepOf);
        const isNow =
          doing?.caseId === testCase.id ||
          (doing === null && lastCaseId === testCase.id && steps.length < count);

        const shown: IRunStep[] =
          doing?.caseId === testCase.id
            ? [...steps, doingStep({ number: doing.numberInCase, action: doing.action })]
            : steps;

        return [
          testCase.id,
          {
            status: isNow
              ? nowStatus
              : steps.length === 0
                ? 'pending'
                : caseVerdict(steps),
            run:
              shown.length === 0
                ? null
                : {
                    id: testCase.id,
                    title: testCase.title,
                    verdict: caseVerdict(steps),
                    durationSec: 0,
                    steps: shown,
                  },
          } satisfies ILiveCase,
        ];
      }),
  );
}

function stepOf(outcome: IStepOutcome): IRunStep {
  return {
    ...(outcome.by === undefined ? {} : { by: outcome.by }),
    number: outcome.stepNumber,
    action: outcome.action,
    verdict: outcome.verdict,
    why: outcome.why.length > 0 ? outcome.why : null,
    shot: outcome.screenshot,
    shotFile: outcome.shotFile,
    span: { from: outcome.at - outcome.tookMs, to: outcome.at },
    bugId: null,
  };
}

function doingStep(props: { number: number; action: string }): IRunStep {
  return {
    ...props,
    verdict: 'running',
    why: null,
    shot: null,
    shotFile: null,
    span: null,
    bugId: null,
  };
}
