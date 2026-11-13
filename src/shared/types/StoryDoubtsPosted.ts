import type { FilingFailure } from './FilingFailure';

/**
 * Como foi postar as dúvidas: onde o comentário fica, quando e quem ele menciona, ou por
 * que o Jira o recusou, nas palavras dele.
 */
export type StoryDoubtsPosted =
  | { isPosted: true; url: string; at: string; mentioned: string | null }
  | { isPosted: false; failure: FilingFailure; said: string };
