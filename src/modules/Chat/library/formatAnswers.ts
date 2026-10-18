import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { IChatQuestion } from '@/shared/types';

/** The QA's answers as the message the agent reads: one line per question, what was picked, then what was written. */
export function formatAnswers(props: {
  questions: IChatQuestion[];
  answers: IQuestionAnswer[];
}): string {
  return props.questions
    .map((question, index) => {
      const answer = props.answers[index];
      const said = [answer?.picked.join(', ') ?? '', answer?.text.trim() ?? '']
        .filter((part) => part.length > 0)
        .join(' — ');

      return `${question.header} (${question.question}): ${said}`;
    })
    .join('\n');
}
