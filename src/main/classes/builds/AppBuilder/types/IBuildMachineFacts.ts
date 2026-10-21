import type { IBuildMachine } from '@/harness/types';

/** What a build reads off this machine: the toolchains the harness tells the agent of, and the PATH its commands run with. */
export interface IBuildMachineFacts extends IBuildMachine {
  path: string;
}
