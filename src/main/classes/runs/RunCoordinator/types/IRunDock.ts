import type { IWindowPlace } from '@ploomes/qazinho-harness/engine';

/** Encosta o QAzinho ao lado do Chrome de um caso à mão, e o devolve no fim da run. */
export interface IRunDock {
  start: (workspaceId: string) => Promise<IWindowPlace | null>;
  end: (workspaceId: string) => void;
}
