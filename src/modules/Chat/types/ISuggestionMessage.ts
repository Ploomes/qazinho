import type { IDraftedCase } from '@/shared/types';

/**
 * O plano que uma exploração ou um agente de fora sugeriu, esperando no chat o QA levá-lo
 * ao plano; o `from` diz quando veio de fora, sem uma run para nomear.
 */
export interface ISuggestionMessage {
  id: string;
  kind: 'suggestion';
  at: string;
  runId: string;
  summary: string;
  cases: IDraftedCase[];
  isTaken: boolean;
  from?: 'outside';
}
