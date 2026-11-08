import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { Harness } from '@salve-software/qazinho-harness';

export interface IMemoryKeeper {
  runner: Pick<AgentRunner, 'ask'>;
  harness: Pick<Harness, 'keep' | 'readKeep'>;
  findCommand: (agentId: string) => Promise<string | null>;
}
