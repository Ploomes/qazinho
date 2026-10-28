import type { BuildStep } from './BuildStep';
import type { IBuildResult } from './IBuildResult';

/**
 * O que chega à página enquanto um build anda: o passo em que está, uma linha do que o
 * agente faz, e como terminou.
 */
export type IBuildEvent =
  | { kind: 'step'; buildId: string; step: BuildStep; bytes: number }
  | { kind: 'line'; buildId: string; text: string }
  | { kind: 'ended'; buildId: string; result: IBuildResult };
