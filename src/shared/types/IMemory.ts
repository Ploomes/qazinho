import type { MemoryScope } from './MemoryScope';
import type { MemoryTarget } from './MemoryTarget';

/**
 * Um fato que o agente aprendeu sobre o app, no projeto inteiro ou num plano; uma apagada
 * fica sem o texto, com a data, para a org saber que se foi.
 */
export interface IMemory {
  id: string;
  text: string;
  scope: MemoryScope;
  workspaceId: string | null;
  target: MemoryTarget;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
