import type { IConfluencePageRef } from './IConfluencePageRef';
import type { JiraFailure } from './JiraFailure';

/**
 * A Confluence page read for the agent, its body as Markdown, or why Confluence did not
 * hand it over, in its own words.
 */
export type ConfluenceRead =
  | { isRead: true; page: IConfluencePageRef; text: string }
  | { isRead: false; failure: JiraFailure; said: string };
