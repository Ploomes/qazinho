import type { ICodexLine } from '@/main/types';
import type { IAgentUsage } from '@/shared/types';

/**
 * What one Codex event says: the session, a message, a command it set out to run, the
 * usage, or how the turn ended.
 */
export function hearCodex(props: { line: ICodexLine; usage: IAgentUsage | null }): {
  sessionId?: string;
  message?: string;
  action?: string;
  usage?: IAgentUsage;
  ended?: { isError: boolean; text: string };
} {
  const { line } = props;

  if (
    line.type === 'item.started' &&
    line.item?.type === 'command_execution' &&
    typeof line.item.command === 'string'
  )
    return { action: `$ ${line.item.command.trim().split('\n')[0] ?? ''}` };

  if (line.type === 'thread.started' && line.thread_id !== undefined)
    return { sessionId: line.thread_id };

  if (line.type === 'item.completed' && line.item?.type === 'agent_message')
    return { message: (line.item.text ?? '').trim() };

  if (line.type === 'turn.completed')
    return {
      usage: {
        fiveHourUsed: props.usage?.fiveHourUsed ?? null,
        sevenDayUsed: props.usage?.sevenDayUsed ?? null,
        resetsAt: props.usage?.resetsAt ?? 0,
        contextTokens: line.usage?.input_tokens ?? 0,
        contextWindow: props.usage?.contextWindow ?? 0,
      },
      ended: { isError: false, text: '' },
    };

  if (line.type === 'turn.failed')
    return {
      ended: {
        isError: true,
        text: line.error?.message ?? '',
      },
    };

  return {};
}
