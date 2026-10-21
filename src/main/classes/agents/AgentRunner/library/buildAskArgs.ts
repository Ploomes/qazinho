import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

/** The flags that make the CLI answer once, in JSON, on the session it already has, with only the tools and folders it was granted. */
export function buildAskArgs(
  props: Omit<IRunAgent, 'workspaceId' | 'prompt' | 'command' | 'agentId'>,
): string[] {
  const { model, sessionId, schema, systemPrompt, mcpConfig, allowedTools } = props;
  const readDirs = props.readDirs ?? [];
  const isTalk = mcpConfig === undefined && allowedTools?.length === 0;

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
    ...(isTalk && readDirs.length === 0 ? ['--tools', ''] : []),
    ...(isTalk && readDirs.length > 0
      ? ['--tools', AGENT_RUN.readTools, ...readDirs.flatMap((dir) => ['--add-dir', dir])]
      : []),
  ];
}
