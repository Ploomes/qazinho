import type { InstallableId } from './InstallableId';

/**
 * One line of an install as it happens: which command of how many, and what it last
 * printed.
 */
export interface ISetupEvent {
  item: InstallableId;
  stage: number;
  stages: number;
  line: string;
}
