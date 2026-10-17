import type { ISavedWorkspace } from './ISavedWorkspace';

/** Everything QAzinho remembered from the last time it was open. */
export interface ISavedState {
  projects: string;
  workspaces: ISavedWorkspace[];
}
