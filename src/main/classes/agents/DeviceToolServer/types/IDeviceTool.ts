/** One device action offered to the agent as an MCP tool, with the JSON Schema of its arguments. */
export interface IDeviceTool {
  name: 'look' | 'goto' | 'click' | 'fill' | 'press' | 'wait' | 'report';
  description: string;
  inputSchema: Record<string, unknown>;
}
