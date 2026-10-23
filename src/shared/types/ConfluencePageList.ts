import type { IConfluencePageRef } from './IConfluencePageRef';
import type { JiraFailure } from './JiraFailure';

/** The Confluence pages a search found, or why Confluence did not list them. */
export type ConfluencePageList =
  | { isListed: true; pages: IConfluencePageRef[] }
  | { isListed: false; failure: JiraFailure };
