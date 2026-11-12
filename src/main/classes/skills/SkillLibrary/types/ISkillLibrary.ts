import type { IGithubSkills } from './IGithubSkills';

export interface ISkillLibrary {
  root: string;
  home: string;
  github: IGithubSkills;
  now?: () => number;
  newId?: () => string;
}
