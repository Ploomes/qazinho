import type { IBugReview } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace/types';

const WEIGHED = new Set(['suggested', 'nothing-new', 'posted', 'dismissed']);

/**
 * The latest look at a bug that came back: it lands on that bug, and once the agent
 * weighed its runs they count as told, so they are never weighed again.
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
