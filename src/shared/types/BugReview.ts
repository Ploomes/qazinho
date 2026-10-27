import type { ReviewVerdict } from './ReviewVerdict';

/** How the agent weighed a bug seen again against its issue, or why it could not. */
export type BugReview =
  | { isReviewed: true; verdict: ReviewVerdict; reason: string; comment: string }
  | { isReviewed: false; failure: 'tracker' | 'agent'; said: string };
