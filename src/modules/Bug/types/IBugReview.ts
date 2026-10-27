import type { BugReviewState } from './BugReviewState';
import type { ReviewVerdict } from '@/shared/types';

/**
 * The latest look at a bug that came back after it was filed: its verdict, update and
 * where it went.
 */
export interface IBugReview {
  runs: string[];
  state: BugReviewState;
  verdict: ReviewVerdict | null;
  reason: string;
  comment: string;
  url: string | null;
  error: string;
  at: string;
}
