import type { IUsageMeter } from '@/main/classes/agents/AgentRunner/types';
import type { ICodexLine } from '@/main/types';
import type { IUsageRecord } from '@/shared/types';

/**
 * O que um turno do Codex gastou, pelo evento que o fecha: os tokens, os lidos do cache à
 * parte, e nenhum custo, porque o Codex não diz um.
 */
export function codexSpentOf(args: {
  line: ICodexLine;
  meter: IUsageMeter;
  agentId: string;
  model: string;
  at: number;
}): IUsageRecord[] {
  const { line } = args;

  if (line.type !== 'turn.completed' || line.usage === undefined) return [];

  const input = countOf(line.usage.input_tokens);
  const cacheRead = Math.min(countOf(line.usage.cached_input_tokens), input);
  const output = countOf(line.usage.output_tokens);

  if (input + output === 0) return [];

  return [
    {
      at: args.at,
      agentId: args.agentId,
      kind: args.meter.kind,
      workspaceId: args.meter.workspaceId,
      projectId: args.meter.projectId,
      model: args.model,
      input: input - cacheRead,
      output,
      cacheRead,
      cacheWrite: 0,
      costUsd: null,
    },
  ];
}

function countOf(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
}
