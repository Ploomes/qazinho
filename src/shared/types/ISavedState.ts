import type { ISavedWorkspace } from './ISavedWorkspace';

/** Tudo o que o QAzinho lembrou da última vez que estava aberto. */
export interface ISavedState {
  projects: string;
  workspaces: ISavedWorkspace[];
}
