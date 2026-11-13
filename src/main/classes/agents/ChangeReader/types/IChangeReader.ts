import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { Harness } from '@salve-software/qazinho-harness';

export interface IChangeReader {
  runner: Pick<AgentRunner, 'ask'>;
  harness: Pick<Harness, 'readChange' | 'readChangeAnswer'>;
  findCommand: (agentId: string) => Promise<string | null>;
}
