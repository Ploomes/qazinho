import type { IWorkspace } from '@/modules/Workspace/types';
import type { IFiledIssue } from '@/shared/types';

/** The issue a bug became in the QA's tracker: it lands on that bug, and nothing else. */
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
      bug.id === bugId ? { ...bug, filed: issue } : bug,
    ),
  };
}
