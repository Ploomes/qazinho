import type { IPlanDoubt, IStoryAnswer } from '@/shared/types';

/** As dúvidas com o que o time respondeu, sem tocar numa já respondida. */
export function doubtsWithAnswers(props: {
  doubts: IPlanDoubt[];
  answers: IStoryAnswer[];
  isAnyDoubt?: boolean;
}): IPlanDoubt[] {
  return props.doubts.map((doubt) => {
    const answer = props.answers.find(({ doubtId }) => doubtId === doubt.id);

    return answer === undefined ||
      doubt.answer !== null ||
      (doubt.sent === null && props.isAnyDoubt !== true)
      ? doubt
      : { ...doubt, answer: { text: answer.text, by: answer.by, at: answer.at } };
  });
}
