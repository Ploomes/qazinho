import type { IConfluencePageRef } from './IConfluencePageRef';
import type { JiraFailure } from './JiraFailure';

/**
 * The Confluence page a plan was published on, or why Confluence refused it, in its own
 * words.
 */
export type PlanPublished =
  | { isPublished: true; page: IConfluencePageRef }
  | { isPublished: false; failure: JiraFailure; said: string };
