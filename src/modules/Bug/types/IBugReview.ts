import type { BugReviewState } from './BugReviewState';
import type { ReviewVerdict } from '@/shared/types';

/** The latest look at a bug that came back after it was filed: the runs it covers, where it stands, what the agent made of it and why, the update it wrote, where that update was posted, and what went wrong posting it. */
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
