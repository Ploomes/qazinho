import type { GithubFailure } from '@/shared/types';

/** Por que um comando do gh falhou, lido de como saiu e do que disse. */
export interface IGhRefusal {
  failure: GithubFailure;
  httpStatus: number | null;
  said: string;
}
