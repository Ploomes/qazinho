import type { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import type { IAgentEvent } from '@/shared/types';

export interface IAgentRunner {
  onEvent: (event: IAgentEvent) => void;
  owners: ProcessOwners;
  folder: string;
  timeoutMs?: number;
  permissions?: { tool: string; mcpConfig: () => string | null };
}
