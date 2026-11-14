import type { ProjectStory } from '@/modules/Home/types';

/** A história que o QA deu, lida no Jira ou no Confluence, ou nenhuma ainda. */
export interface IStoryFieldProps {
  value: ProjectStory | null;
  onChange: (value: ProjectStory | null) => void;
}
