import type { GithubFailure } from '@/shared/types';

/**
 * O que um comando do gh devolveu: a saída, ou por que o GitHub ou o gh o recusou, com o
 * status HTTP quando o GitHub mandou um.
 */
export type GhAnswer =
  | { isOk: true; text: string }
  | { isOk: false; failure: GithubFailure; httpStatus: number | null; said: string };
