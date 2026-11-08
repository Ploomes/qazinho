import type { ILiveBlock } from '@/main/classes/agents/AgentRunner/types';
import type { IAgentLine } from '@/main/types';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';
import { replyInPartial } from './replyInPartial';

/**
 * Um pedaço da resposta que a CLI escreve: o bloco depois dele, e o que o QA já pode ler,
 * do texto ou do campo de resposta da chamada que encerra o turno.
 */
export function followPartial(props: { line: IAgentLine; block: ILiveBlock | null }): {
  block: ILiveBlock | null;
  said: string | null;
} {
  const { line, block } = props;
  const { event } = line;

  if (line.type !== 'stream_event' || event === undefined || isFromAgentWithin(line))
    return { block, said: null };

  if (event.type === 'content_block_start')
    return { block: blockOf(event.content_block), said: null };

  if (event.type === 'content_block_stop') return { block: null, said: null };

  if (event.type !== 'content_block_delta' || block === null)
    return { block, said: null };

  const written = `${block.written}${event.delta?.text ?? event.delta?.partial_json ?? ''}`;
  const said =
    block.kind === 'text'
      ? written.trimStart()
      : replyInPartial({ written, field: AGENT_RUN.replyField });

  return { block: { ...block, written }, said: said.length > 0 ? said : null };
}

function isFromAgentWithin(line: IAgentLine): boolean {
  return line.parent_tool_use_id !== undefined && line.parent_tool_use_id !== null;
}

function blockOf(
  started: { type: string; name?: string } | undefined,
): ILiveBlock | null {
  if (started?.type === 'text') return { kind: 'text', written: '' };

  return started?.type === 'tool_use' && started.name === AGENT_RUN.structuredTool
    ? { kind: 'answer', written: '' }
    : null;
}
