import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

/**
 * As flags de uma resposta do Codex em linhas JSON sem pedir aprovação: somente leitura,
 * ou uma pasta gravável.
 */
export function buildCodexArgs(
  props: Omit<IRunAgent, 'workspaceId' | 'prompt' | 'command' | 'agentId'> & {
    schemaFile: string | null;
    ownServers: string[];
  },
): string[] {
  const { model, sessionId, systemPrompt, mcpConfig, schemaFile, writeDir } = props;
  const server = qazinhoServerOf(mcpConfig);
  const served = servedOf(mcpConfig);

  return [
    'exec',
    ...(sessionId === null ? [] : ['resume', sessionId]),
    '--json',
    '--skip-git-repo-check',
    ...(model.length === 0 ? [] : ['-m', model]),
    ...(schemaFile === null ? [] : ['--output-schema', schemaFile]),
    '-c',
    'approval_policy="never"',
    ...(writeDir === undefined
      ? ['-c', 'sandbox_mode="read-only"']
      : [
          '-c',
          'sandbox_mode="workspace-write"',
          '-c',
          'sandbox_workspace_write.network_access=true',
          '-C',
          writeDir,
        ]),
    ...(systemPrompt === undefined
      ? []
      : ['-c', `developer_instructions=${JSON.stringify(systemPrompt)}`]),
    ...props.ownServers
      .filter(
        (name) => props.permissionTool === undefined || name === AGENT_RUN.orgServer,
      )
      .filter((name) => !served.includes(name))
      .flatMap((name) => ['-c', `mcp_servers.${name}.enabled=false`]),
    ...(server === null
      ? []
      : ['-c', `mcp_servers.qazinho.url=${JSON.stringify(server.url)}`]),
    ...(server === null || server.timeoutMs === null
      ? []
      : [
          '-c',
          `mcp_servers.qazinho.tool_timeout_sec=${String(Math.ceil(server.timeoutMs / 1000))}`,
        ]),
    '-',
  ];
}

function qazinhoServerOf(mcpConfig: string | undefined): {
  url: string;
  timeoutMs: number | null;
} | null {
  if (mcpConfig === undefined) return null;

  try {
    const read = JSON.parse(mcpConfig) as {
      mcpServers?: { qazinho?: { url?: unknown; timeout?: unknown } };
    };
    const server = read.mcpServers?.qazinho;

    return typeof server?.url === 'string'
      ? {
          url: server.url,
          timeoutMs: typeof server.timeout === 'number' ? server.timeout : null,
        }
      : null;
  } catch {
    return null;
  }
}

function servedOf(mcpConfig: string | undefined): string[] {
  if (mcpConfig === undefined) return [];

  try {
    return Object.keys(
      (JSON.parse(mcpConfig) as { mcpServers?: Record<string, unknown> }).mcpServers ??
        {},
    );
  } catch {
    return [];
  }
}
