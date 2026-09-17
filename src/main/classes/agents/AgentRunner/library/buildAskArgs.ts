import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';

/** The flags that make the CLI answer once, in JSON, on the session it already has. */
export function buildAskArgs(
  props: Omit<IRunAgent, 'workspaceId' | 'agentId' | 'prompt' | 'command'>,
): string[] {
  const { model, sessionId, schema, systemPrompt, mcpConfig } = props;

  return [
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    // No model means the agent's own default, as its config on this machine sets it.
    ...(model.length === 0 ? [] : ['--model', model]),
    ...(sessionId === null ? [] : ['--resume', sessionId]),
    ...(schema === undefined ? [] : ['--json-schema', schema]),
    ...(systemPrompt === undefined ? [] : ['--append-system-prompt', systemPrompt]),
    // With the device's tools the agent gets those and nothing else: no shell, no edits, no other MCP.
    ...(mcpConfig === undefined
      ? []
      : [
          '--mcp-config',
          mcpConfig,
          '--strict-mcp-config',
          '--tools',
          '',
          '--allowedTools',
          'mcp__gocrash',
        ]),
  ];
}
