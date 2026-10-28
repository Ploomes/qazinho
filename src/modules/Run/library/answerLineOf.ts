import type { RunAnswer } from '@/shared/types';

/**
 * Como dizer o jeito que uma pergunta ao QA terminou: nas próprias palavras do QA, ou
 * como uma frase que nomeia a variável com que um segredo foi.
 */
export function answerLineOf(
  answer: RunAnswer,
): { kind: 'words'; text: string } | { kind: 'sentence'; key: string; name: string } {
  if (answer.kind === 'said') return { kind: 'words', text: answer.text };

  if (answer.kind === 'secret')
    return {
      kind: 'sentence',
      key: answer.isKept ? 'RUN.ANSWERED_SECRET_KEPT' : 'RUN.ANSWERED_SECRET',
      name: `\${${answer.name}}`,
    };

  return {
    kind: 'sentence',
    key: answer.kind === 'unanswered' ? 'RUN.ANSWERED_NONE' : 'RUN.ANSWERED_STOPPED',
    name: '',
  };
}
