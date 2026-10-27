import type { IChangeWork } from './IChangeWork';
import type { ISuiteChange } from '@/shared/types';

/**
 * A change once its copy was made, or not: the change as it stands, where it works, null
 * when no copy could be made, and the team's latest commit messages.
 */
export interface ICopiedSuite {
  change: ISuiteChange;
  work: IChangeWork | null;
  commits: string[];
}
