import type { IConfluencePageRef } from './IConfluencePageRef';
import type { JiraFailure } from './JiraFailure';

/**
 * As páginas do Confluence que uma busca achou, ou por que o Confluence não as listou.
 */
export type ConfluencePageList =
  | { isListed: true; pages: IConfluencePageRef[] }
  | { isListed: false; failure: JiraFailure };
