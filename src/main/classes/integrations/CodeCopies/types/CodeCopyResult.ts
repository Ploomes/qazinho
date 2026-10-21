import type { GithubFailure, ICodeCopy } from '@/shared/types';

/** A branch's code copied and read, or why GitHub would not hand it over. */
export type CodeCopyResult =
  | { isReady: true; copy: ICodeCopy }
  | { isReady: false; failure: GithubFailure; said: string };
