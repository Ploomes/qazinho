import type { AgentMcp } from '@/main/classes/integrations/AgentMcp';
import type { IDetectedAgent, OutsideCaller, OutsideToolCall } from '@/shared/types';
import type { OutsideHost } from '@ploomes/qazinho-harness';

export interface IOutsideServerProps {
  file: string;
  host: Pick<OutsideHost, 'start' | 'stop' | 'address'>;
  mcp: Pick<AgentMcp, 'holds' | 'addAddress' | 'removeName'>;
  agents: () => Promise<IDetectedAgent[]>;
  perform: (
    call: OutsideToolCall,
    caller: OutsideCaller,
  ) => Promise<{ text: string; isError: boolean }>;
}
