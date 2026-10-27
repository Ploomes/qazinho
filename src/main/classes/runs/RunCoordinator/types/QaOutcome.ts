import type { QaReply } from '@/shared/types';

/**
 * How a question to the QA ends in main: their reply, no answer in time, or the run
 * stopped first.
 */
export type QaOutcome = QaReply | { kind: 'unanswered' } | { kind: 'stopped' };
