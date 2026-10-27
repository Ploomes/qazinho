import type { CaseChoice, IPlanUpdate } from '@/modules/Pro/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IProShare } from '@/shared/types';
import { mergeCases } from './mergeCases';
import { syncedCaseOf } from './syncedCaseOf';

/**
 * Each plan the org moved in a project, joined with this computer's as the QA chose; a
 * workspace no longer here is left out.
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
