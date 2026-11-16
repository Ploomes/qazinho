import type { IUsageMeter } from '@/main/classes/agents/AgentRunner/types';
import type { IAgentLine } from '@/main/types';
import type { IUsageRecord } from '@/shared/types';

/**
 * O que um turno do Claude Code gastou em cada modelo, pela linha final dele; sem o gasto
 * por modelo, o total da linha no modelo pedido.
 */
export function spentOf(args: {
  line: IAgentLine;
  meter: IUsageMeter;
  agentId: string;
  model: string;
  at: number;
}): IUsageRecord[] {
  const { line } = args;

  if (line.type !== 'result') return [];

  const base = {
    at: args.at,
    agentId: args.agentId,
    kind: args.meter.kind,
    workspaceId: args.meter.workspaceId,
    projectId: args.meter.projectId,
  };
  const models = Object.entries(line.modelUsage ?? {}).map(([model, used]) => ({
    ...base,
    model,
    input: countOf(used.inputTokens),
    output: countOf(used.outputTokens),
    cacheRead: countOf(used.cacheReadInputTokens),
    cacheWrite: countOf(used.cacheCreationInputTokens),
    costUsd: dollarsOf(used.costUSD),
  }));

  if (models.length > 0) return models.filter(isSpent);

  const total = {
    ...base,
    model: args.model,
    input: countOf(line.usage?.input_tokens),
    output: countOf(line.usage?.output_tokens),
    cacheRead: countOf(line.usage?.cache_read_input_tokens),
    cacheWrite: countOf(line.usage?.cache_creation_input_tokens),
    costUsd: dollarsOf(line.total_cost_usd),
  };

  return isSpent(total) ? [total] : [];
}

function countOf(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
}

function dollarsOf(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function isSpent(record: IUsageRecord): boolean {
  return (
    record.input + record.output + record.cacheRead + record.cacheWrite > 0 ||
    (record.costUsd ?? 0) > 0
  );
}
