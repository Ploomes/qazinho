import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';

function qazinhoUrlOf(mcpConfig: string | undefined): string | null {
  if (mcpConfig === undefined) return null;

  try {
    const read = JSON.parse(mcpConfig) as {
      mcpServers?: { qazinho?: { url?: unknown } };
    };
    const url = read.mcpServers?.qazinho?.url;

    return typeof url === 'string' ? url : null;
  } catch {
    return null;
  }
}

/** The flags that make Codex answer once, as JSON lines, read-only, never stopping to ask for approval. */
export function buildCodexArgs(
  props: Omit<IRunAgent, 'workspaceId' | 'prompt' | 'command' | 'agentId'> & {
    schemaFile: string | null;
  },
): string[] {
  const { model, sessionId, systemPrompt, mcpConfig, schemaFile } = props;
  const url = qazinhoUrlOf(mcpConfig);

  return [
    'exec',
    ...(sessionId === null ? [] : ['resume', sessionId]),
    '--json',
    '--skip-git-repo-check',
    ...(model.length === 0 ? [] : ['-m', model]),
    ...(schemaFile === null ? [] : ['--output-schema', schemaFile]),
    '-c',
    'approval_policy="never"',
    '-c',
    'sandbox_mode="read-only"',
    ...(systemPrompt === undefined
      ? []
      : ['-c', `developer_instructions=${JSON.stringify(systemPrompt)}`]),
    ...(url === null ? [] : ['-c', `mcp_servers.qazinho.url=${JSON.stringify(url)}`]),
    '-',
  ];
}
