import type { IConfluencePageRef } from './IConfluencePageRef';
import type { JiraFailure } from './JiraFailure';

/**
 * A página do Confluence em que um plano foi publicado, ou por que o Confluence o
 * recusou, nas palavras dele.
 */
export type PlanPublished =
  | { isPublished: true; page: IConfluencePageRef }
  | { isPublished: false; failure: JiraFailure; said: string };
