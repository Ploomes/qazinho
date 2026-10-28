import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

/**
 * Uma chamada que deixa entrar os servidores MCP do próprio QA, cada permissão respondida
 * pela ferramenta do QAzinho.
 */
export function withPermissions(props: {
  call: IRunAgent;
  permissions: { tool: string; mcpConfig: string | null };
}): IRunAgent {
  const { call, permissions } = props;

  if (call.permissionTool !== undefined) return call;
  if (call.mcpConfig !== undefined) return { ...call, permissionTool: permissions.tool };
  if (permissions.mcpConfig === null) return call;

  const readDirs = call.readDirs ?? [];

  return {
    ...call,
    mcpConfig: permissions.mcpConfig,
    permissionTool: permissions.tool,
    tools: call.tools ?? (readDirs.length > 0 ? AGENT_RUN.readTools.split(',') : []),
  };
}
