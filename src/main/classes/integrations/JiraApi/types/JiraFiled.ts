import type { JiraFailure } from '@/shared/types';

/** The issue a bug became in Jira, or why Jira refused it, in its own words. */
export type JiraFiled =
  | { isFiled: true; key: string; url: string }
  | { isFiled: false; failure: JiraFailure; said: string };
