import type { IBug } from '@/modules/Bug/types';
import type { IFlatStep } from '@/modules/Run/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { BUG_COPY } from '@/modules/Bug/constants';

/** Turns the step that broke into something a developer can act on. */
export function makeBug(props: { workspace: IWorkspace; step: IFlatStep }): IBug {
  const { workspace, step } = props;
  const copy = BUG_COPY[workspace.planKind];
  const runId = workspace.live?.id ?? 'r-01';

  return {
    id: `BUG-${String(workspace.bugs.length + 1).padStart(2, '0')}`,
    severity: copy.severity,
    title: copy.title,
    body: copy.body,
    expected: step.expected,
    got: copy.got,
    observed: copy.observed,
    runId,
    runWhen: 'a moment ago',
    caseId: step.caseId,
    step: `step ${String(step.numberInCase)}`,
    target:
      workspace.planKind === 'web' ? 'Web · Chromium 1280 × 800' : 'Android · Pixel 7',
    build: workspace.planKind === 'web' ? 'staging' : 'debug .apk',
    seen: 'once',
    clipRatio: workspace.planKind === 'web' ? '16 / 10' : '9 / 19.5',
    clipLength: '0:12',
    repro: [
      { action: step.action, isBad: true },
      { action: step.expected, isBad: false },
    ],
    shots: [
      { label: 'before', isBad: false },
      { label: 'the step that broke', isBad: true },
    ],
    isNew: true,
  };
}
