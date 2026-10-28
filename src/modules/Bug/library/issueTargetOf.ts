import type { IProjectRepository } from '@/modules/Project/types';
import type { IJiraProject, IssueTarget, IssueTracker } from '@/shared/types';

/**
 * Para onde um bug vai a menos que o QA diga outra coisa: para onde foi o último, o
 * projeto da história, ou um repositório.
 */
export function issueTargetOf(props: {
  kept: IssueTarget | null;
  trackers: IssueTracker[];
  story: string | null;
  projects: IJiraProject[];
  repositories: IProjectRepository[];
}): IssueTarget | null {
  const { kept, trackers, projects, repositories } = props;
  const hasJira = trackers.includes('jira');
  const hasGithub = trackers.includes('github');
  const storyProject = /^([A-Z][A-Z0-9_]*)-\d+$/i
    .exec(props.story ?? '')?.[1]
    ?.toUpperCase();
  const [repository] = repositories;
  const [project] = projects;

  if (kept !== null && trackers.includes(kept.tracker)) return kept;

  if (hasJira && storyProject !== undefined)
    return { tracker: 'jira', project: storyProject };

  if (hasGithub && repository !== undefined)
    return { tracker: 'github', owner: repository.owner, name: repository.name };

  if (hasJira && project !== undefined) return { tracker: 'jira', project: project.key };

  return null;
}
