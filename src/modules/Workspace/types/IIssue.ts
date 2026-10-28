import type { IssueSource } from './IssueSource';

/**
 * O ticket a partir do qual um workspace trabalha, e onde ele abre. É de onde vem o
 * resultado esperado.
 */
export interface IIssue {
  key: string;
  title: string;
  source: IssueSource;
  url: string;
}
