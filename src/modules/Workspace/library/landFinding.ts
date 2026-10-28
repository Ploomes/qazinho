import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunFinding, IStepOutcome } from '@/shared/types';
import { catchBug } from '@/modules/Bug/library';

/**
 * Um bug que o agente da run registrou ao lado de um passo: cai fora do plano, no bug já
 * aberto que ele é ou como um novo, e a seção da run diz isso uma vez.
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
