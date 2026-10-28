import type { RunAnswer } from '@/shared/types';

/**
 * Uma pergunta que o agente da run fez ao QA, guardada na seção da run depois que
 * terminou: o que perguntou, em qual passo, e como foi respondida.
 */
export interface IAskMessage {
  id: string;
  kind: 'ask';
  at: string;
  runId: string;
  askId: string;
  question: string;
  caseId: string;
  stepNumber: number;
  answer: RunAnswer;
}
