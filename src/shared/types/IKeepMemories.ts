import type { IMemoryBrief } from './IMemoryBrief';
import type { KeepEvent } from './KeepEvent';
import type { Language } from './Language';

/** O que a página pede à main para pesar contra o que o agente guarda de um projeto. */
export interface IKeepMemories {
  projectId: string;
  agentId: string;
  model: string;
  language: Language;
  memories: IMemoryBrief[];
  events: KeepEvent[];
}
