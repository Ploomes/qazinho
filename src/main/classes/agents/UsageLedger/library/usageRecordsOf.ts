import type { IUsageRecord, UsageKind } from '@/shared/types';

const KINDS: readonly UsageKind[] = [
  'chat',
  'case',
  'explore',
  'prepare',
  'sign-in',
  'assistant',
  'memory',
  'change',
  'build',
  'review',
  'skill',
];

/** Os gastos guardados num texto, um por linha; uma linha quebrada fica de fora. */
export function usageRecordsOf(text: string): IUsageRecord[] {
  return text.split('\n').flatMap((line) => {
    if (line.trim() === '') return [];

    try {
      const value: unknown = JSON.parse(line);

      return isUsageRecord(value) ? [value] : [];
    } catch {
      return [];
    }
  });
}

function isUsageRecord(value: unknown): value is IUsageRecord {
  if (typeof value !== 'object' || value === null) return false;

  const record = value as Record<string, unknown>;
  const isCount = (key: string) => typeof record[key] === 'number' && record[key] >= 0;
  const isIdOrNull = (key: string) =>
    record[key] === null || typeof record[key] === 'string';

  return (
    isCount('at') &&
    typeof record.agentId === 'string' &&
    (KINDS as readonly unknown[]).includes(record.kind) &&
    isIdOrNull('workspaceId') &&
    isIdOrNull('projectId') &&
    typeof record.model === 'string' &&
    isCount('input') &&
    isCount('output') &&
    isCount('cacheRead') &&
    isCount('cacheWrite') &&
    (record.costUsd === null || isCount('costUsd'))
  );
}
