import type { ReviewVerdict } from '@/shared/types';

/** What the agent made of a bug seen again: its verdict, why, and the comment it wrote. */
export interface IReviewAnswer {
  verdict: ReviewVerdict;
  reason: string;
  comment: string;
}
