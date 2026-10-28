import type { IAgentLine } from '@/main/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';

/**
 * O Claude Code responde um pedido `--json-schema` por uma chamada de ferramenta, nunca
 * como o texto do resultado.
 */
export function toStructured(line: IAgentLine): string {
  if (line.type !== 'assistant') return '';

  const answered = (line.message?.content ?? []).find(
    (block) => block.type === 'tool_use' && block.name === AGENT_RUN.structuredTool,
  );

  return answered?.input === undefined ? '' : JSON.stringify(answered.input);
}
