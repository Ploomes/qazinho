import type { IWorkspace } from '@/modules/Workspace/types';
import type { IFiledIssue } from '@/shared/types';
import { appearancesOf } from '@/modules/Bug/library';

/**
 * A issue em que um bug virou no tracker do QA: cai nesse bug, e em nada mais; as runs
 * que o pegaram até ali contam como avisadas.
 */
export function landFiled(props: {
  workspace: IWorkspace;
  bugId: string;
  issue: IFiledIssue;
}): IWorkspace {
  const { workspace, bugId, issue } = props;

  if (!workspace.bugs.some(({ id }) => id === bugId)) return workspace;

  return {
    ...workspace,
    bugs: workspace.bugs.map((bug) =>
      bug.id === bugId
        ? {
            ...bug,
            filed: issue,
            reviewedRuns: [...new Set(appearancesOf(bug).map(({ runId }) => runId))],
          }
        : bug,
    ),
  };
}
