import type { ISprintStory } from '@/shared/types';

/** A sprint aberta do board de um projeto, como o Jira a leu por último. */
export interface ISprintRead {
  sprint: string | null;
  stories: ISprintStory[];
}
