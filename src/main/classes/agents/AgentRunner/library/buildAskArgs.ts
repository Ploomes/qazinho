import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

/** The flags that make the CLI answer once, in JSON, on the session it already has, with only the tools, commands and folders it was granted, QAzinho's own tools beside them, and none of the QA's own hooks or MCP servers. */
export function buildAskArgs(
  props: Omit<IRunAgent, 'workspaceId' | 'prompt' | 'command' | 'agentId'>,
): string[] {
  const { model, sessionId, schema, systemPrompt, mcpConfig, allowedTools, tools } =
    props;
  const readDirs = props.readDirs ?? [];
  const isTalk =
    mcpConfig === undefined && tools === undefined && allowedTools?.length === 0;
  const isWork = mcpConfig === undefined && tools !== undefined;

  return [
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    '--settings',
    AGENT_RUN.settings,
    ...(model.length === 0 ? [] : ['--model', model]),
    ...(sessionId === null ? [] : ['--resume', sessionId]),
    ...(schema === undefined ? [] : ['--json-schema', schema]),
    ...(systemPrompt === undefined ? [] : ['--append-system-prompt', systemPrompt]),
    ...(mcpConfig === undefined
      ? ['--strict-mcp-config']
      : [
          '--mcp-config',
          mcpConfig,
          '--strict-mcp-config',
          '--tools',
          (tools ?? []).join(','),
          '--allowedTools',
          ...(allowedTools ?? []),
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
