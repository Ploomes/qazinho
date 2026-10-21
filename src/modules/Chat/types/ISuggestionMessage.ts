import type { IDraftedCase } from '@/shared/types';

/** The plan an exploration suggested, waiting in the chat for the QA to take it into the plan. */
export interface ISuggestionMessage {
  id: string;
  kind: 'suggestion';
  at: string;
  runId: string;
  summary: string;
  cases: IDraftedCase[];
  isTaken: boolean;
}
