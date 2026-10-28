import type { FilingFailure } from './FilingFailure';

/**
 * Como foi postar uma atualização: onde o comentário fica, com os arquivos que o tracker
 * não aceitou, ou por que não foi postado, nas palavras do tracker.
 */
export type BugComment =
  | { isPosted: true; url: string; missed: string[] }
  | { isPosted: false; failure: FilingFailure; said: string };
