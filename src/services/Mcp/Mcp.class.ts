import type {
  IMcpServerStatus,
  IMcpServerTarget,
  IMcpSignIn,
  McpActionResult,
  McpSignInProgress,
} from '@/shared/types';
import { i18n } from '@/languages';

/**
 * The only caller of the MCP side of the bridge: servers that live in the QA's own agent.
 */
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
        said: i18n.t('COMMON.NO_BRIDGE'),
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
    return (
      (await window.qazinho?.removeMcpServer(target)) ?? {
        ok: false,
        error: i18n.t('COMMON.NO_BRIDGE'),
      }
    );
  }
}
