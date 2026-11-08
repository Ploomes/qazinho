import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunFinding } from '@/shared/types';
import { catchBug } from '@/modules/Bug/library';
import { outcomeOfFinding } from './outcomeOfFinding';

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

  const seen = outcomeOfFinding({ workspaceId: workspace.id, finding });
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
