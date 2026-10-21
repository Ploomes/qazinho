import type { IProjectRepository } from './IProjectRepository';
import type { ITarget } from './ITarget';

/** One environment of the app under test, with every target that reaches it and the repositories it is made of. */
export interface IProject {
  id: string;
  name: string;
  targets: ITarget[];
  repositories: IProjectRepository[];
}
