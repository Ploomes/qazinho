import type { ReviewVerdict } from './ReviewVerdict';

/** How the agent weighed a bug seen again against its issue: its verdict, why, and the update it wrote; or why it could not, reading the issue or asking the agent, in their words. */
export type BugReview =
  | { isReviewed: true; verdict: ReviewVerdict; reason: string; comment: string }
  | { isReviewed: false; failure: 'tracker' | 'agent'; said: string };
