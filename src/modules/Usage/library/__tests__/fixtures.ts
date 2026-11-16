import type { IUsageRecord } from '@/shared/types';

/** Um gasto de exemplo: um caso no Sonnet, com o que o teste trocar. */
export function spend(over: Partial<IUsageRecord> = {}): IUsageRecord {
  return {
    at: new Date(2026, 10, 16, 15, 0).getTime(),
    agentId: 'claude-code',
    kind: 'case',
    workspaceId: 'w1',
    projectId: 'p1',
    model: 'claude-sonnet-5-5',
    input: 100,
    output: 20,
    cacheRead: 1000,
    cacheWrite: 80,
    costUsd: 0.5,
    ...over,
  };
}
