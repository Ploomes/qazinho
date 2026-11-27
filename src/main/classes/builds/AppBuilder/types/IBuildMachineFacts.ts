import type { IBuildMachine } from '@ploomes/qazinho-harness';

/**
 * O que um build lê desta máquina: as toolchains de que o harness avisa o agente, e o
 * PATH com que os comandos dele rodam.
 */
export interface IBuildMachineFacts extends IBuildMachine {
  path: string;
}
