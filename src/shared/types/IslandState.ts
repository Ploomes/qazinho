import type { IIslandQuestion } from './IIslandQuestion';

/**
 * O que a ilha do notch mostra: nada, uma run andando, os agentes esperando o QA, ou
 * o fim de uma run.
 */
export type IslandState =
  | { kind: 'idle' }
  | {
      kind: 'running';
      workspaceId: string;
      name: string;
      detail: string;
      done: number;
      total: number;
      isExploring: boolean;
      isPaused: boolean;
    }
  | { kind: 'asking'; questions: IIslandQuestion[] }
  | { kind: 'ended'; workspaceId: string; name: string; passed: number; failed: number };
