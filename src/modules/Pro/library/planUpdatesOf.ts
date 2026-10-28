import type { CaseChoice, IPlanUpdate } from '@/modules/Pro/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IProShare } from '@/shared/types';
import { mergeCases } from './mergeCases';
import { syncedCaseOf } from './syncedCaseOf';

/**
 * Cada plano que a org mexeu num projeto, juntado com o deste computador como o QA
 * escolheu; um workspace que não está mais aqui fica de fora.
 */
export function planUpdatesOf(props: {
  share: IProShare | undefined;
  workspaces: IWorkspace[];
  choices?: Record<string, Record<string, CaseChoice>>;
}): IPlanUpdate[] {
  const { share, workspaces, choices } = props;

  return (share?.conflicts ?? []).flatMap((conflict) => {
    const workspace = workspaces.find(({ id }) => id === conflict.workspaceId);

    if (workspace === undefined) return [];

    const merged = mergeCases({
      base: conflict.base,
      mine: workspace.plan.map(syncedCaseOf),
      theirs: conflict.cases,
      choices: choices?.[workspace.id],
    });

    return [
      {
        conflict,
        workspace,
        cases: merged.cases,
        clashes: merged.clashes,
        isBusy: workspace.live !== null && !workspace.live.isDone,
      },
    ];
  });
}
