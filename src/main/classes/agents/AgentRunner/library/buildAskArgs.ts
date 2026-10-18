import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';

/** The flags that make the CLI answer once, in JSON, on the session it already has. */
export function buildAskArgs(
  props: Omit<IRunAgent, 'workspaceId' | 'prompt' | 'command' | 'agentId'>,
): string[] {
  const { model, sessionId, schema, systemPrompt, mcpConfig, allowedTools } = props;

  return [
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    ...(model.length === 0 ? [] : ['--model', model]),
    ...(sessionId === null ? [] : ['--resume', sessionId]),
    ...(schema === undefined ? [] : ['--json-schema', schema]),
    ...(systemPrompt === undefined ? [] : ['--append-system-prompt', systemPrompt]),
    ...(mcpConfig === undefined
      ? []
      : [
          '--mcp-config',
          mcpConfig,
          '--strict-mcp-config',
          '--tools',
          '',
          '--allowedTools',
          ...(allowedTools ?? []),
        ]),
    ...(mcpConfig === undefined && allowedTools?.length === 0 ? ['--tools', ''] : []),
  ];
}
