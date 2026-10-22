import type { JiraFailure } from '@/shared/types';

/** What Jira answered one request with: its body, or why it did not, with what it said. */
export type JiraAnswer =
  | { isOk: true; body: unknown; bytes: ArrayBuffer | null }
  | { isOk: false; failure: JiraFailure; said: string };
