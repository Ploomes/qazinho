import type { ToolAnswer } from '@/harness/tools/types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PERMISSION_TOOL, SOURCE_TOOLS } from '@/harness/tools/servers/sources/constants';
import { permissionOf } from './permissionOf';

/** Puts every source tool on an MCP server, with its schema, a call that passes it going to `call`; and the tool Claude Code asks for the chat's permissions, answered at once. */
export function registerSourceTools(props: {
  mcp: McpServer;
  call: (call: { name: string; args: Record<string, unknown> }) => Promise<ToolAnswer>;
}): void {
  for (const tool of SOURCE_TOOLS)
    props.mcp.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.input },
      (args: Record<string, unknown>) => props.call({ name: tool.name, args }),
    );

  props.mcp.registerTool(
    PERMISSION_TOOL.name,
    { description: PERMISSION_TOOL.description, inputSchema: PERMISSION_TOOL.input },
    (args: { tool_name: string; input?: unknown }) => ({
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            permissionOf({ toolName: args.tool_name, input: args.input }),
          ),
        },
      ],
    }),
  );
}
