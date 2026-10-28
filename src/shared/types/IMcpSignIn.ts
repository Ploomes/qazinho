import type { IMcpServerTarget } from './IMcpServerTarget';

/** Qual servidor conectar em qual agente, e se no Terminal em vez de fora de vista. */
export interface IMcpSignIn {
  target: IMcpServerTarget;
  inTerminal: boolean;
}
