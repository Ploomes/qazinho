import type { ReviewItem } from './ReviewItem';

/** As trocas que o agente propôs para uma mudança, o resumo dela, e quando. */
export interface IChangeReview {
  summary: string;
  items: ReviewItem[];
  at: string;
}
