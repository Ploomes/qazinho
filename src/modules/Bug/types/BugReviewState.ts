/**
 * Where the look at a bug that came back stands: the agent weighing it, an update waiting
 * on the QA, nothing new for the issue, posting, posted, put aside, or not done.
 */
export type BugReviewState =
  | 'reviewing'
  | 'suggested'
  | 'nothing-new'
  | 'posting'
  | 'posted'
  | 'dismissed'
  | 'failed';
