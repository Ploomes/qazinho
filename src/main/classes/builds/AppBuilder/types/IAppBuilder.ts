import type { IBuildMachineFacts } from './IBuildMachineFacts';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IGithubCode } from '@/main/classes/integrations/CodeCopies/types';
import type { IBuildEvent } from '@/shared/types';
import type { Harness } from '@salve-software/qazinho-harness';

/**
 * O que um build precisa: o gh para o código, o agente do QA e o harness para
 * construí-lo, onde guardá-lo, e um olhar para a máquina.
 */
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
