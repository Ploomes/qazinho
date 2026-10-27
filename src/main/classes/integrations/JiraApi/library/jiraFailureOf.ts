import type { JiraFailure } from '@/shared/types';

/**
 * Why an answer from Jira is not a yes, by its status; no answer at all means it was out
 * of reach.
 */
export function jiraFailureOf(answer: { status: number } | null): JiraFailure {
  if (answer === null) return 'unreachable';
  if (answer.status === 401 || answer.status === 403) return 'unauthorized';
  if (answer.status === 404) return 'not-found';
  if (answer.status === 400 || answer.status === 413) return 'rejected';

  return 'unexpected';
}
