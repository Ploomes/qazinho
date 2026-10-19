import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunFinding, IStepOutcome } from '@/shared/types';
import { makeBug } from '@/modules/Bug/library';

/** A bug the run's agent filed on the side of a step: it joins the bugs, marked outside the plan, and the run's section says so. */
export function landFinding(props: {
  workspace: IWorkspace;
  finding: IRunFinding;
  at: string;
}): IWorkspace {
  const { workspace, finding, at } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  const seen: IStepOutcome = {
    workspaceId: workspace.id,
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
  };
  const bug = {
    ...makeBug({ workspace, outcome: seen, outcomes: [...live.outcomes, seen] }),
    isIncidental: true,
  };

  return {
    ...workspace,
    bugs: [...workspace.bugs, bug],
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'finding',
        at,
        runId: live.id,
        bugId: bug.id,
        title: bug.title,
      },
    ],
  };
}
