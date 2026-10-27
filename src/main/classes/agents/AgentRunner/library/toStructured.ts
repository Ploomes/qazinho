import type { IAgentLine } from '@/main/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

/**
 * Claude Code answers a `--json-schema` ask through a tool call, never as the result
 * text.
 */
export function toStructured(line: IAgentLine): string {
  if (line.type !== 'assistant') return '';

  const answered = (line.message?.content ?? []).find(
    (block) => block.type === 'tool_use' && block.name === AGENT_RUN.structuredTool,
  );

  return answered?.input === undefined ? '' : JSON.stringify(answered.input);
}
