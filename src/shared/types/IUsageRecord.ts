import type { UsageKind } from './UsageKind';

/**
 * O que uma chamada ao agente gastou num modelo: os tokens, o custo ao preço da API
 * quando o agente diz, e o trabalho, o workspace e o projeto que ela pagou.
 */
export interface IUsageRecord {
  at: number;
  agentId: string;
  kind: UsageKind;
  workspaceId: string | null;
  projectId: string | null;
  model: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  costUsd: number | null;
}
