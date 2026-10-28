import type { JiraFailure } from '@/shared/types';

/**
 * A issue em que um bug virou no Jira, ou por que o Jira a recusou, nas palavras dele.
 */
export type JiraFiled =
  | { isFiled: true; key: string; url: string }
  | { isFiled: false; failure: JiraFailure; said: string };
