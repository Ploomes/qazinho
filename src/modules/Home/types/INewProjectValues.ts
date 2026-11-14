import type { IProjectBuild } from './IProjectBuild';
import type { ProjectStory } from './ProjectStory';
import type { IProjectRepository } from '@/modules/Project/types';
import type { IDesignLink, IImportSource } from '@/shared/types';

/** O que o QA preencheu para cada cartão que marcou na criação de um projeto. */
export interface INewProjectValues {
  web: string;
  builds: IProjectBuild[];
  repositories: IProjectRepository[];
  tests: IImportSource | null;
  story: ProjectStory | null;
  design: IDesignLink | null;
}
