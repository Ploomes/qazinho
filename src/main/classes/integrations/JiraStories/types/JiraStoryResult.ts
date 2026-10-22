import type { IJiraStoryCopy, JiraFailure } from '@/shared/types';

/** A Jira story read with its files, or why Jira did not hand it over. */
export type JiraStoryResult =
  { isReady: true; copy: IJiraStoryCopy } | { isReady: false; failure: JiraFailure };
