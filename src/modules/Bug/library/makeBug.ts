import type { IBug, IBugShot } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IStepOutcome } from '@/types';
import { countSeen } from './countSeen';

function shotsFor(props: {
  outcome: IStepOutcome;
  outcomes: IStepOutcome[];
}): IBugShot[] {
  const before = props.outcomes
    .filter((one) => one.index < props.outcome.index && one.screenshot !== null)
    .at(-1);

  const broke = {
    label: 'the step that broke',
    isBad: true,
    src: props.outcome.screenshot,
    file: props.outcome.shotFile,
  };

  return before
    ? [
        { label: 'before', isBad: false, src: before.screenshot, file: before.shotFile },
        broke,
      ]
    : [broke];
}

/** Turns the step that broke into something a developer can act on. */
export function makeBug(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
  outcomes: IStepOutcome[];
}): IBug {
  const { workspace, outcome, outcomes } = props;
  const step = `step ${String(outcome.stepNumber)}`;
  const testCase = workspace.plan.find(({ id }) => id === outcome.caseId);

  return {
    id: `BUG-${String(workspace.bugs.length + 1).padStart(2, '0')}`,
    severity: outcome.severity,
    title: outcome.title.length > 0 ? outcome.title : `${outcome.action} did not hold up`,
    body: outcome.why,
    expected: outcome.expected,
    got: outcome.got,
    runId: workspace.live?.id ?? 'r-01',
    runWhen: workspace.live?.startedAt ?? '',
    caseId: outcome.caseId,
    caseTitle: testCase?.title ?? outcome.caseId,
    step,
    target:
      workspace.planKind === 'web' ? 'Web · Chrome 1280 × 800' : 'Android · emulator',
    seen: countSeen({ workspace, caseId: outcome.caseId, step }),
    repro: outcomes
      .filter((one) => one.caseId === outcome.caseId && one.index <= outcome.index)
      .map((one) => ({ action: one.action, isBad: one.index === outcome.index })),
    shots: shotsFor({ outcome, outcomes }),
    isNew: true,
  };
}
