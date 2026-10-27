import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunFinding, IStepOutcome } from '@/shared/types';
import { catchBug } from '@/modules/Bug/library';

/**
 * A bug the run's agent filed on the side of a step: it lands outside the plan, on the
 * bug already open it is or as a new one, and the run's section says so once.
 */
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
    ...(finding.sameAs === undefined ? {} : { sameAs: finding.sameAs }),
    ...(finding.frame === undefined ? {} : { frame: finding.frame }),
  };
  const caught = catchBug({
    workspace,
    outcome: seen,
    outcomes: [...live.outcomes, seen],
    isIncidental: true,
  });
  const bug = caught.bugs.find(({ id }) => id === caught.bugId);

  if (caught.how === 'repeat' || bug === undefined) return workspace;

  return {
    ...workspace,
    bugs: caught.bugs,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'finding',
        at,
        runId: live.id,
        bugId: bug.id,
        title: bug.title,
        ...(caught.how === 'again' ? { isSeenAgain: true } : {}),
      },
    ],
  };
}
