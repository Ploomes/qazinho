import type { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import type { IAgentEvent, IUsageRecord } from '@/shared/types';

export interface IAgentRunner {
  onEvent: (event: IAgentEvent) => void;
  onSpent?: (records: IUsageRecord[]) => void;
  owners: ProcessOwners;
  folder: string;
  timeoutMs?: number;
  permissions?: { tool: string; mcpConfig: () => string | null };
}
