import type { FilingFailure } from './FilingFailure';
import type { IFiledIssue } from './IFiledIssue';

/**
 * Como foi mandar um bug: a issue em que virou, os arquivos que o tracker não aceitou e a
 * história a que foi ligado, ou por que nenhuma issue foi feita, nas palavras do tracker.
 */
export type BugFiling =
  | { isFiled: true; issue: IFiledIssue; missed: string[]; linked: string | null }
  | { isFiled: false; failure: FilingFailure; said: string };
