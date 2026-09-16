import type { IAskAgent } from '@/types';

/** The flags that make the CLI answer once, in JSON, on the session it already has. */
export function buildAskArgs(
  props: Omit<IAskAgent, 'workspaceId' | 'agentId' | 'prompt'>,
): string[] {
  const { model, sessionId, schema } = props;

  return [
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    '--model',
    model,
    ...(sessionId === null ? [] : ['--resume', sessionId]),
    ...(schema === undefined ? [] : ['--json-schema', schema]),
  ];
}
