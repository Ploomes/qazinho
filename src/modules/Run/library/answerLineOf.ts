import type { RunAnswer } from '@/shared/types';

/** How to say the way a question to the QA ended: in the QA's own words, or as a sentence that names the variable a secret went as. */
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
