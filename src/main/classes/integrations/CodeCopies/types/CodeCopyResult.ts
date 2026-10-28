import type { GithubFailure, ICodeCopy } from '@/shared/types';

/** O código de uma branch copiado e lido, ou por que o GitHub não o entregou. */
export type CodeCopyResult =
  | { isReady: true; copy: ICodeCopy }
  | { isReady: false; failure: GithubFailure; said: string };
