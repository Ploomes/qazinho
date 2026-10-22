import type { IBug, IBugShot } from '@/modules/Bug/types';
import type { ViewportId } from '@/modules/Device/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IStepOutcome, TargetKind } from '@/shared/types';
import { viewportOf } from '@/modules/Device/library';
import { countSeen } from './countSeen';

function shotsFor(props: {
  outcome: IStepOutcome;
  outcomes: IStepOutcome[];
}): IBugShot[] {
  const before = props.outcomes
    .filter((one) => one.index < props.outcome.index && one.screenshot !== null)
    .at(-1);

  const broke = {
    isBad: true,
    src: props.outcome.screenshot,
    file: props.outcome.shotFile,
  };

  return before
    ? [{ isBad: false, src: before.screenshot, file: before.shotFile }, broke]
    : [broke];
}

function targetOf(props: { kind: TargetKind; viewportId: ViewportId }): string {
  if (props.kind === 'ios') return 'iOS';

  if (props.kind === 'android') return 'Android';

  const viewport = viewportOf(props.viewportId);

  return `Web · Chrome ${String(viewport.width)} × ${String(viewport.height)}`;
}

/** Turns the step that broke into something a developer can act on, with who caught it and on what. */
export function makeBug(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
  outcomes: IStepOutcome[];
}): IBug {
  const { workspace, outcome, outcomes } = props;
  const testCase = workspace.plan.find(({ id }) => id === outcome.caseId);
  const by = workspace.live?.by ?? null;

  return {
    id: `BUG-${String(workspace.bugs.length + 1).padStart(2, '0')}`,
    severity: outcome.severity,
    title: outcome.title.length > 0 ? outcome.title : outcome.action,
    body: outcome.why,
    expected: outcome.expected,
    got: outcome.got,
    runId: workspace.live?.id ?? 'r-01',
    runWhen: workspace.live?.startedAt ?? '',
    caseId: outcome.caseId,
    caseTitle: testCase?.title ?? outcome.caseId,
    stepNumber: outcome.stepNumber,
    target: targetOf({
      kind: by?.targetKind ?? (workspace.planKind === 'web' ? 'web' : 'android'),
      viewportId: workspace.viewportId,
    }),
    agent: by?.agent ?? '',
    modelName: by?.modelName ?? null,
    seenRuns: countSeen({
      workspace,
      caseId: outcome.caseId,
      stepNumber: outcome.stepNumber,
    }),
    repro: outcomes
      .filter((one) => one.caseId === outcome.caseId && one.index <= outcome.index)
      .map((one) => ({ action: one.action, isBad: one.index === outcome.index })),
    shots: shotsFor({ outcome, outcomes }),
    sightings: [],
    isNew: true,
    isIncidental: false,
    at: outcome.at,
    filed: null,
    reviewedRuns: [],
    review: null,
    frame: outcome.frame ?? null,
  };
}
