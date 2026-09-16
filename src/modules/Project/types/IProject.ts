import type { ITarget } from './ITarget';

/** One environment of the app under test, with every target that reaches it. */
export interface IProject {
  id: string;
  name: string;
  targets: ITarget[];
}
