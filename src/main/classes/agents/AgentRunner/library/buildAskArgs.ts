import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

/**
 * As flags de uma resposta da CLI em JSON na sessão dela, só com as ferramentas e pastas
 * que recebeu.
 */
export function buildAskArgs(
  props: Omit<IRunAgent, 'workspaceId' | 'prompt' | 'command' | 'agentId' | 'meter'>,
): string[] {
  const { model, sessionId, schema, systemPrompt, mcpConfig, allowedTools, tools } =
    props;
  const isOwnServers = props.permissionTool !== undefined;
  const readDirs = props.readDirs ?? [];
  const isTalk =
    mcpConfig === undefined && tools === undefined && allowedTools?.length === 0;
  const isWork = mcpConfig === undefined && tools !== undefined;

  return [
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    ...(props.isStreamed === true ? ['--include-partial-messages'] : []),
    '--settings',
    AGENT_RUN.settings,
    ...(model.length === 0 ? [] : ['--model', model]),
    ...(sessionId === null ? [] : ['--resume', sessionId]),
    ...(schema === undefined ? [] : ['--json-schema', schema]),
    ...(systemPrompt === undefined ? [] : ['--append-system-prompt', systemPrompt]),
    ...(isOwnServers
      ? [
          '--permission-prompt-tool',
          props.permissionTool ?? '',
          '--disallowedTools',
          `mcp__${AGENT_RUN.orgServer}`,
        ]
      : []),
    ...(mcpConfig === undefined
      ? isOwnServers
        ? []
        : ['--strict-mcp-config']
      : [
          '--mcp-config',
          mcpConfig,
          ...(isOwnServers ? [] : ['--strict-mcp-config']),
          '--tools',
          (tools ?? []).join(','),
          ...((allowedTools ?? []).length === 0
            ? []
            : ['--allowedTools', ...(allowedTools ?? [])]),
          ...(tools === undefined ? [] : readDirs.flatMap((dir) => ['--add-dir', dir])),
        ]),
    ...(isTalk && readDirs.length === 0 ? ['--tools', ''] : []),
    ...(isTalk && readDirs.length > 0
      ? ['--tools', AGENT_RUN.readTools, ...readDirs.flatMap((dir) => ['--add-dir', dir])]
      : []),
    ...(isWork
      ? [
          '--tools',
          tools.join(','),
          ...((allowedTools ?? []).length === 0
            ? []
            : ['--allowedTools', ...(allowedTools ?? [])]),
          ...readDirs.flatMap((dir) => ['--add-dir', dir]),
        ]
      : []),
  ];
}
