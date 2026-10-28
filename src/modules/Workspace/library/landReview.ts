import type { IBugReview } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace/types';

const WEIGHED = new Set(['suggested', 'nothing-new', 'posted', 'dismissed']);

/**
 * A última olhada num bug que voltou: cai nesse bug, e depois que o agente pesou as runs
 * dele elas contam como avisadas, para nunca serem pesadas de novo.
 */
export function landReview(props: {
  workspace: IWorkspace;
  bugId: string;
  review: IBugReview;
}): IWorkspace {
  const { workspace, bugId, review } = props;

  if (!workspace.bugs.some(({ id }) => id === bugId)) return workspace;

  return {
    ...workspace,
    bugs: workspace.bugs.map((bug) =>
      bug.id === bugId
        ? {
            ...bug,
            review,
            reviewedRuns: WEIGHED.has(review.state)
              ? [...new Set([...bug.reviewedRuns, ...review.runs])]
              : bug.reviewedRuns,
          }
        : bug,
    ),
  };
}
