import type { IRun } from '@/modules/Run';
import { caseVerdict, runDayOf } from '@/modules/Run/library';

const EXPLORATION_ENDINGS = {
  finished: 'ended when the explorer finished or its time ran out',
  stopped: 'stopped by the QA before the end',
  broke: 'broke before the end',
  interrupted: 'cut short when QAzinho closed',
} as const;

const ENDINGS = {
  finished: 'walked the whole plan',
  stopped: 'stopped by the QA before the end',
  broke: 'broke before the end',
  interrupted: 'cut short when QAzinho closed',
} as const;

/** What QAzinho knows of one run, as the lines its agent reads. */
export function runFactsOf(props: { run: IRun; isBrief: boolean }): string[] {
  const { run, isBrief } = props;
  const cost = run.costUsd === null ? '' : `, cost $${run.costUsd.toFixed(3)}`;
  const day = runDayOf(run);

  if (run.kind === 'explore')
    return [
      `an exploration of the app with no plan, started ${day === null ? '' : `${day} at `}${run.startedAt}, took ${String(run.durationSec)}s${cost}, ${EXPLORATION_ENDINGS[run.endedBy]}`,
      ...run.cases.flatMap(({ steps }) =>
        isBrief
          ? [`screens: ${steps.map(({ action }) => action).join(', ')}`]
          : steps.map(
              (step) =>
                `  screen ${String(step.number)}: ${step.action}${step.why === null ? '' : ` (${step.why})`}`,
            ),
      ),
      ...(isBrief || run.suggestion === undefined
        ? []
        : [
            `what the explorer said: ${run.suggestion.summary}`,
            ...run.suggestion.cases.flatMap((suggested) => [
              `suggested ${suggested.priority} case: ${suggested.title}${suggested.goal.length === 0 ? '' : ` (${suggested.goal})`}`,
              ...(suggested.preconditions.length === 0
                ? []
                : [`  before: ${suggested.preconditions}`]),
              ...suggested.steps.map(
                (step, index) =>
                  `  step ${String(index + 1)}: ${step.action} → ${step.expected}`,
              ),
            ]),
          ]),
    ];

  return [
    `started ${day === null ? '' : `${day} at `}${run.startedAt}, took ${String(run.durationSec)}s${cost}, ${ENDINGS[run.endedBy]}`,
    `cases: ${tallyOf(run.cases.map((runCase) => caseVerdict(runCase.steps)))}`,
    `steps: ${String(run.counts.passed)} passed, ${String(run.counts.failed)} failed, ${String(run.counts.blocked)} blocked, ${String(run.counts.skipped)} skipped`,
    ...run.cases.flatMap((runCase) => {
      const steps = isBrief
        ? runCase.steps.filter(
            ({ verdict }) => verdict === 'failed' || verdict === 'blocked',
          )
        : runCase.steps;

      if (isBrief && steps.length === 0) return [];

      return [
        `${runCase.id} ${runCase.title}: ${caseVerdict(runCase.steps)}`,
        ...steps.map(
          (step) =>
            `  step ${String(step.number)} ${step.verdict}${step.by === 'replay' ? ' without the agent' : step.by === 'healed' ? ' by the agent, after the recorded walk stopped holding' : ''}: ${step.action}${step.why === null ? '' : ` (${step.why})`}`,
        ),
      ];
    }),
  ];
}

function tallyOf(verdicts: string[]): string {
  const count = (wanted: string) =>
    String(verdicts.filter((verdict) => verdict === wanted).length);

  return `${count('passed')} passed, ${count('failed')} failed, ${count('blocked')} blocked, ${count('skipped')} skipped`;
}
