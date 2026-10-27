import type { IWorkspace } from '@/modules/Workspace/types';
import type { IFiledIssue } from '@/shared/types';
import { appearancesOf } from '@/modules/Bug/library';

/**
 * The issue a bug became in the QA's tracker: it lands on that bug, and nothing else; the
 * runs that caught it so far count as told.
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
