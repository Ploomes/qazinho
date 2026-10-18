import { jsonSchemaOf } from '@/harness/library/jsonSchemaOf';
import { DEVICE_TOOLS } from '@/harness/tools/servers/device/constants';

/** The device tools as MCP lists them to the agent, each with the JSON Schema of its arguments. */
export function listDeviceTools(): {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}[] {
  return DEVICE_TOOLS.map(({ name, description, input }) => ({
    name,
    description,
    inputSchema: jsonSchemaOf(input),
  }));
}
