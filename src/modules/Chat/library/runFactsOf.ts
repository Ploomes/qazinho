import type { IRun } from '@/modules/Run';
import { caseVerdict } from '@/modules/Run/library';

const ENDINGS = {
  finished: 'walked the whole plan',
  stopped: 'stopped by the QA before the end',
  broke: 'broke before the end',
  interrupted: 'cut short when QAzinho closed',
} as const;

function tallyOf(verdicts: string[]): string {
  const count = (wanted: string) =>
    String(verdicts.filter((verdict) => verdict === wanted).length);

  return `${count('passed')} passed, ${count('failed')} failed, ${count('blocked')} blocked, ${count('skipped')} skipped`;
}

/** What QAzinho knows of one run, as the lines its agent reads: every step, or only the ones that failed or were blocked. */
export function runFactsOf(props: { run: IRun; isBrief: boolean }): string[] {
  const { run, isBrief } = props;
  const cost = run.costUsd === null ? '' : `, cost $${run.costUsd.toFixed(3)}`;

  return [
    `started ${run.startedAt}, took ${String(run.durationSec)}s${cost}, ${ENDINGS[run.endedBy]}`,
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
            `  step ${String(step.number)} ${step.verdict}: ${step.action}${step.why === null ? '' : ` (${step.why})`}`,
        ),
      ];
    }),
  ];
}
