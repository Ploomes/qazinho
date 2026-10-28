import type { ReviewVerdict } from './ReviewVerdict';

/**
 * Como o agente pesou um bug visto de novo contra a issue dele, ou por que não conseguiu.
 */
export type BugReview =
  | { isReviewed: true; verdict: ReviewVerdict; reason: string; comment: string }
  | { isReviewed: false; failure: 'tracker' | 'agent'; said: string };
