import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { IChatQuestion } from '@/shared/types';

/**
 * As respostas do QA como a mensagem que o agente lê: uma linha por pergunta, o que foi
 * escolhido, as variáveis que guardou, depois o que foi escrito.
 */
export function formatAnswers(props: {
  questions: IChatQuestion[];
  answers: IQuestionAnswer[];
}): string {
  return props.questions
    .map((question, index) => {
      const answer = props.answers[index];
      const kept = answer?.kept ?? [];
      const said = [
        answer?.doubtId === undefined
          ? ''
          : `sent to the story as ${answer.doubtId}, since no one here knows yet`,
        answer?.picked.join(', ') ?? '',
        kept.length === 0
          ? ''
          : `kept the variables ${kept.map((name) => `\${${name}}`).join(', ')}`,
        answer?.text.trim() ?? '',
      ]
        .filter((part) => part.length > 0)
        .join(' — ');

      return `${question.header} (${question.question}): ${said}`;
    })
    .join('\n');
}
