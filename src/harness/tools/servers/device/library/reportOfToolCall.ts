import type { IStepReport } from '@/harness/tools/servers/device/types';

const VERDICTS = ['passed', 'failed', 'blocked'];
const SEVERITIES = ['high', 'medium', 'low'];

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** A report the run can file, or what the agent left out, said back to it so it reports again. */
export function reportOfToolCall(
  args: Record<string, unknown> | undefined,
): { report: IStepReport } | { error: string } {
  const step = Number(args?.step);
  const verdict = text(args?.verdict);
  const severity = text(args?.severity);

  if (!Number.isInteger(step) || step < 1)
    return { error: '"report" needs "step": the number of the step you judged.' };

  if (!VERDICTS.includes(verdict))
    return { error: '"report" needs "verdict": passed, failed or blocked.' };

  if (text(args?.why).length === 0)
    return { error: '"report" needs "why": what the verdict rests on.' };

  return {
    report: {
      step,
      verdict: verdict as IStepReport['verdict'],
      why: text(args?.why),
      got: text(args?.got),
      title: text(args?.title),
      severity: (SEVERITIES.includes(severity)
        ? severity
        : 'medium') as IStepReport['severity'],
      note: text(args?.note),
    },
  };
}
