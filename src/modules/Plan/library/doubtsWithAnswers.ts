import type { IPlanDoubt, IStoryAnswer } from '@/shared/types';

/** As dúvidas com o que o time respondeu na história, sem tocar numa já respondida. */
export function doubtsWithAnswers(props: {
  doubts: IPlanDoubt[];
  answers: IStoryAnswer[];
}): IPlanDoubt[] {
  return props.doubts.map((doubt) => {
    const answer = props.answers.find(({ doubtId }) => doubtId === doubt.id);

    return answer === undefined || doubt.answer !== null || doubt.sent === null
      ? doubt
      : { ...doubt, answer: { text: answer.text, by: answer.by, at: answer.at } };
  });
}
