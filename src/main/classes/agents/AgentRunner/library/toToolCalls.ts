import type { IAgentLine } from '@/main/types';
import { toolCallOf } from './toolCallOf';

/** As ferramentas que um turno do assistente chamou, na ordem, para a tela contar. */
export function toToolCalls(line: IAgentLine): { tool: string; target: string }[] {
  if (line.type !== 'assistant') return [];

  return (line.message?.content ?? []).flatMap((block) =>
    block.type === 'tool_use' && block.name !== undefined
      ? [toolCallOf({ name: block.name, input: block.input })]
      : [],
  );
}
