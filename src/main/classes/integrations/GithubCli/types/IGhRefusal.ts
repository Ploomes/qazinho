import type { GithubFailure } from '@/shared/types';

/** Why a gh command failed, read from how it exited and what it said. */
export interface IGhRefusal {
  failure: GithubFailure;
  httpStatus: number | null;
  said: string;
}
