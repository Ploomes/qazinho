import type { ISprintStory } from './ISprintStory';
import type { JiraFailure } from './JiraFailure';

/** A sprint aberta de um board e as histórias dela, ou por que o Jira não respondeu. */
export type SprintStories =
  | { isListed: true; sprint: string | null; stories: ISprintStory[] }
  | { isListed: false; failure: JiraFailure };
