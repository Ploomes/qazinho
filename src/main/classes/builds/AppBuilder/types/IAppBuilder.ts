import type { IBuildMachineFacts } from './IBuildMachineFacts';
import type { Harness } from '@/harness';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IGithubCode } from '@/main/classes/integrations/CodeCopies/types';
import type { IBuildEvent } from '@/shared/types';

/** What a build needs: gh for the code, the QA's agent and the harness to build it, where to keep it, and a look at the machine. */
export interface IAppBuilder {
  github: IGithubCode;
  runner: Pick<AgentRunner, 'ask' | 'cancel'>;
  harness: Pick<Harness, 'build' | 'readBuild'>;
  root: string;
  findCommand: (agentId: string) => Promise<string | null>;
  machine: () => Promise<IBuildMachineFacts>;
  readPlist: (file: string) => Promise<string | null>;
  onEvent: (event: IBuildEvent) => void;
  now?: () => number;
}
