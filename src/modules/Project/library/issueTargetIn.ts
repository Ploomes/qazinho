import type { IssueTarget } from '@/shared/types';

/** Where a saved project files its bugs, when it says it whole: a Jira project's key, or a repository's owner and name; anything else is nowhere yet. */
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
