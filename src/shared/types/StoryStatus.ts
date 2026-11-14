import type { JiraFailure } from './JiraFailure';

/** Em que status uma história está agora, ou por que o Jira não disse. */
export type StoryStatus =
  { isRead: true; status: string } | { isRead: false; failure: JiraFailure };
