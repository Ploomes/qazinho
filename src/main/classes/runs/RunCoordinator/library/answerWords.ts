import type { RunAnswer } from '@/shared/types';

/**
 * What the agent hears once its question to the QA ended: their words, a secret by its
 * name alone, or that no answer came, then what to do next.
 */
export function answerWords(props: {
  answer: RunAnswer;
  carryOn: string;
  noAnswer: string;
}): string {
  const { answer, carryOn, noAnswer } = props;

  if (answer.kind === 'said') return `The QA answered:\n${answer.text}\n\n${carryOn}`;

  if (answer.kind === 'secret')
    return `The QA typed the answer as a secret: write \${${answer.name}} where it goes, and QAzinho types its value. You never see it. ${carryOn}`;

  if (answer.kind === 'unanswered') return `The QA did not answer in time. ${noAnswer}`;

  return 'The QA stopped the run: end your turn now.';
}
