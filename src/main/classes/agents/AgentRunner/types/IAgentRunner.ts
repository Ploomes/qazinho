import type { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import type { IAgentEvent } from '@/types';

export interface IAgentRunner {
  onEvent: (event: IAgentEvent) => void;
  owners: ProcessOwners;
}
