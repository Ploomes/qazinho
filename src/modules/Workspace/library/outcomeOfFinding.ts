import type { IRunFinding, IStepOutcome } from '@/shared/types';

/** Um bug registrado ao lado de um passo, escrito como o passo que falhou nele. */
export function outcomeOfFinding(props: {
  workspaceId: string;
  finding: IRunFinding;
}): IStepOutcome {
  const { workspaceId, finding } = props;

  return {
    workspaceId,
    caseId: finding.caseId,
    stepNumber: finding.stepNumber,
    index: finding.index,
    action: finding.action,
    expected: finding.expected,
    verdict: 'failed',
    why: '',
    got: finding.got,
    title: finding.title,
    severity: finding.severity,
    tookMs: 0,
    at: finding.at,
    screenshot: finding.screenshot,
    shotFile: finding.shotFile,
    ...(finding.sameAs === undefined ? {} : { sameAs: finding.sameAs }),
    ...(finding.frame === undefined ? {} : { frame: finding.frame }),
    ...(finding.category === undefined ? {} : { category: finding.category }),
  };
}
