import type { IIntegrationStatus } from './IIntegrationStatus';
import type { JiraFailure } from './JiraFailure';

/**
 * Confluence turned on or off beside Jira, with Jira's status as it stands now, or why
 * Confluence could not be turned on.
 */
export type ConfluenceSwitch =
  | { isSwitched: true; status: IIntegrationStatus }
  | { isSwitched: false; failure: JiraFailure; said: string };
