import type { RunAnswer } from '@/shared/types';

/**
 * O que o agente ouve quando a pergunta dele ao QA terminou: as palavras dele, um segredo
 * só pelo nome, ou que nenhuma resposta veio, depois o que fazer em seguida.
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
