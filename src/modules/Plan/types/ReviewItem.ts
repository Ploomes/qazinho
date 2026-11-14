import type { RefusalReason } from './RefusalReason';
import type { ReviewState } from './ReviewState';
import type { IDraftedCase } from '@/shared/types';

/**
 * Uma troca que o leitor de uma mudança propôs: um caso como fica, um caso novo, ou uma
 * dúvida para o time, e como o QA a decidiu.
 */
export type ReviewItem = {
  id: string;
  state: ReviewState;
  refusal?: RefusalReason;
  refusalNote?: string;
} & (
  | { kind: 'change'; caseId: string; why: string; case: IDraftedCase }
  | { kind: 'add'; why: string; case: IDraftedCase }
  | { kind: 'doubt'; question: string }
);
