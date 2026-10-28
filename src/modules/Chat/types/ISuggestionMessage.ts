import type { IDraftedCase } from '@/shared/types';

/** O plano que uma exploração sugeriu, esperando no chat o QA levá-lo ao plano. */
export interface ISuggestionMessage {
  id: string;
  kind: 'suggestion';
  at: string;
  runId: string;
  summary: string;
  cases: IDraftedCase[];
  isTaken: boolean;
}
