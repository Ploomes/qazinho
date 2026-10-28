import type { IssueTarget } from '@/shared/types';

/**
 * Para onde um projeto salvo registra os bugs, quando o diz inteiro: a chave de um
 * projeto do Jira, ou o dono e o nome de um repositório; senão, lugar nenhum ainda.
 */
export function issueTargetIn(saved: unknown): IssueTarget | undefined {
  if (typeof saved !== 'object' || saved === null) return undefined;

  const { tracker, project, owner, name } = saved as Record<string, unknown>;

  if (tracker === 'jira' && typeof project === 'string' && project !== '')
    return { tracker, project };

  if (
    tracker === 'github' &&
    typeof owner === 'string' &&
    typeof name === 'string' &&
    owner !== '' &&
    name !== ''
  )
    return { tracker, owner, name };

  return undefined;
}
