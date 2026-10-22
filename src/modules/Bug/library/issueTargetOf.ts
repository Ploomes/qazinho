import type { IProjectRepository } from '@/modules/Project/types';
import type { IJiraProject, IssueTarget, IssueTracker } from '@/shared/types';

/** Where a bug goes unless the QA says otherwise: where the project's last bug went, else the Jira project of the story the workspace works from, else the project's first repository, else the first Jira project listed; null when no tracker is connected. */
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
