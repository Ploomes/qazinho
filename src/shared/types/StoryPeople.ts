import type { JiraFailure } from './JiraFailure';

/** Quem escreveu uma história e se o QA já a acompanha, ou por que o Jira não disse. */
export type StoryPeople =
  | { isRead: true; reporter: string | null; isWatching: boolean }
  | { isRead: false; failure: JiraFailure };
