import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { IChatQuestion } from '@/shared/types';

/** The QA's answers as the message the agent reads: one line per question, what was picked, the variables it kept, then what was written. */
export function formatAnswers(props: {
  questions: IChatQuestion[];
  answers: IQuestionAnswer[];
}): string {
  return props.questions
    .map((question, index) => {
      const answer = props.answers[index];
      const kept = answer?.kept ?? [];
      const said = [
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
