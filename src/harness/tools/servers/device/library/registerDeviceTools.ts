import type { ToolAnswer } from '@/harness/tools/types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEVICE_TOOLS } from '@/harness/tools/servers/device/constants';

/** Puts every device tool on an MCP server, with its schema; a call that passes it goes to `call`. */
export function registerDeviceTools(props: {
  mcp: McpServer;
  call: (call: { name: string; args: Record<string, unknown> }) => Promise<ToolAnswer>;
}): void {
  for (const tool of DEVICE_TOOLS)
    props.mcp.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.input },
      (args: Record<string, unknown>) => props.call({ name: tool.name, args }),
    );
}
