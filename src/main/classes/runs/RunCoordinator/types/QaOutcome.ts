import type { QaReply } from '@/shared/types';

/**
 * Como uma pergunta ao QA termina na main: a resposta dele, nenhuma resposta a tempo, ou
 * a run parada antes.
 */
export type QaOutcome = QaReply | { kind: 'unanswered' } | { kind: 'stopped' };
