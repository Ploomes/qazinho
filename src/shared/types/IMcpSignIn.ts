import type { IMcpServerTarget } from './IMcpServerTarget';

/** Which server to connect in which agent, and whether in Terminal rather than out of sight. */
export interface IMcpSignIn {
  target: IMcpServerTarget;
  inTerminal: boolean;
}
