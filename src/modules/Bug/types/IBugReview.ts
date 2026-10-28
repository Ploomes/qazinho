import type { BugReviewState } from './BugReviewState';
import type { ReviewVerdict } from '@/shared/types';

/**
 * A última olhada num bug que voltou depois de registrado: o veredito, a atualização e
 * para onde foi.
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
