import type { JiraFailure } from '@/shared/types';

/**
 * Por que uma resposta do Jira não é um sim, pelo status; nenhuma resposta quer dizer que
 * estava fora de alcance.
 */
export function jiraFailureOf(answer: { status: number } | null): JiraFailure {
  if (answer === null) return 'unreachable';
  if (answer.status === 401 || answer.status === 403) return 'unauthorized';
  if (answer.status === 404) return 'not-found';
  if (answer.status === 400 || answer.status === 413) return 'rejected';

  return 'unexpected';
}
