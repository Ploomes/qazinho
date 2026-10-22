import type { IJiraStory, JiraFailure } from '@/shared/types';

/** What JiraStories needs from Jira: a story read whole, and one of its files downloaded. */
export interface IJiraRead {
  story: (
    key: string,
  ) => Promise<
    { isRead: true; story: IJiraStory } | { isRead: false; failure: JiraFailure }
  >;
  download: (props: { id: string; file: string; maxBytes: number }) => Promise<boolean>;
}
