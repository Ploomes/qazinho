import type { IStepReport } from '@/main/classes/agents/DeviceToolServer/types';
import type { IShot } from '@/main/classes/devices/types';
import type { IFlatStep, IStepOutcome } from '@/types';

/** A step as the run files it: the agent's report, the screenshot taken when it arrived, and the time it took. */
export function outcomeOfReport(props: {
  report: IStepReport;
  step: IFlatStep;
  index: number;
  workspaceId: string;
  tookMs: number;
  shot: IShot | null;
}): IStepOutcome {
  const { report, step, index, workspaceId, tookMs, shot } = props;

  return {
    workspaceId,
    caseId: step.caseId,
    stepNumber: step.numberInCase,
    index,
    action: step.action,
    expected: step.expected,
    verdict: report.verdict,
    why: report.why,
    got: report.got,
    title: report.title,
    severity: report.severity,
    tookMs,
    screenshot: shot?.dataUrl ?? null,
    shotFile: shot?.file ?? null,
  };
}
