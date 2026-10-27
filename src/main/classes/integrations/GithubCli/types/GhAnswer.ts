import type { GithubFailure } from '@/shared/types';

/**
 * What one gh command gave back: its output, or why GitHub or gh refused it, with the
 * HTTP status when GitHub sent one.
 */
export type GhAnswer =
  | { isOk: true; text: string }
  | { isOk: false; failure: GithubFailure; httpStatus: number | null; said: string };
