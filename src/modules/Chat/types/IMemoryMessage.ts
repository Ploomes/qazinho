import type { IMemoryChange } from '@/modules/Memory/types';

/** O que o agente aprendeu ou corrigiu sobre o app, numa linha baixa no chat. */
export interface IMemoryMessage {
  id: string;
  kind: 'memory';
  at: string;
  changes: IMemoryChange[];
}
