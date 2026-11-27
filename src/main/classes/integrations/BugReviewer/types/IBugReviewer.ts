import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { BugFiler } from '@/main/classes/integrations/BugFiler';
import type { Harness } from '@ploomes/qazinho-harness';

export interface IBugReviewer {
  filer: Pick<BugFiler, 'read'>;
  runner: Pick<AgentRunner, 'ask'>;
  harness: Pick<Harness, 'review' | 'readReview'>;
  findCommand: (agentId: string) => Promise<string | null>;
  runsRoot: string;
}
