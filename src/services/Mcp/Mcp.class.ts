import type { IMcpServerStatus, McpActionResult, McpServerId } from '@/shared/types';
import { NO_BRIDGE_MCP } from './constants';

/** The only caller of the MCP side of the bridge: servers that live in the QA's own agent. */
export class Mcp {
  public static async list(): Promise<IMcpServerStatus[]> {
    return (await window.qazinho?.listMcpServers()) ?? [];
  }

  public static async add(id: McpServerId): Promise<McpActionResult> {
    return (await window.qazinho?.addMcpServer(id)) ?? NO_BRIDGE_MCP;
  }

  public static async remove(id: McpServerId): Promise<McpActionResult> {
    return (await window.qazinho?.removeMcpServer(id)) ?? NO_BRIDGE_MCP;
  }

  public static async signIn(id: McpServerId): Promise<McpActionResult> {
    return (await window.qazinho?.signInMcpServer(id)) ?? NO_BRIDGE_MCP;
  }
}
