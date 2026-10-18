import type {
  IMcpServerStatus,
  IMcpServerTarget,
  McpActionResult,
  McpSignInResult,
} from '@/shared/types';
import { NO_BRIDGE_MCP } from './constants';

/** The only caller of the MCP side of the bridge: servers that live in the QA's own agent. */
export class Mcp {
  public static async list(agentId: string): Promise<IMcpServerStatus[]> {
    return (await window.qazinho?.listMcpServers(agentId).catch(() => [])) ?? [];
  }

  public static async connect(target: IMcpServerTarget): Promise<McpSignInResult> {
    return (await window.qazinho?.connectMcpServer(target)) ?? NO_BRIDGE_MCP;
  }

  public static async remove(target: IMcpServerTarget): Promise<McpActionResult> {
    return (await window.qazinho?.removeMcpServer(target)) ?? NO_BRIDGE_MCP;
  }
}
