import type {
  IMcpServerStatus,
  IMcpServerTarget,
  IMcpSignIn,
  McpActionResult,
  McpSignInProgress,
} from '@/shared/types';
import { NO_BRIDGE_MCP } from './constants';

/** The only caller of the MCP side of the bridge: servers that live in the QA's own agent. */
export class Mcp {
  public static async list(agentId: string): Promise<IMcpServerStatus[]> {
    return (await window.qazinho?.listMcpServers(agentId).catch(() => [])) ?? [];
  }

  public static async connect(signIn: IMcpSignIn): Promise<McpSignInProgress> {
    return (
      (await window.qazinho?.connectMcpServer(signIn)) ?? {
        target: signIn.target,
        steps: ['check'],
        phase: 'failed',
        at: 'check',
        failure: 'unsupported',
        said: NO_BRIDGE_MCP.error,
        canUseTerminal: false,
      }
    );
  }

  public static async cancel(target: IMcpServerTarget): Promise<void> {
    await window.qazinho?.cancelMcpSignIn(target);
  }

  public static onSignIn(listener: (progress: McpSignInProgress) => void): () => void {
    return window.qazinho?.onMcpSignIn(listener) ?? (() => undefined);
  }

  public static async remove(target: IMcpServerTarget): Promise<McpActionResult> {
    return (await window.qazinho?.removeMcpServer(target)) ?? NO_BRIDGE_MCP;
  }
}
