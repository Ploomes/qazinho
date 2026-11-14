import type { IChangeReview } from '@/modules/Plan/types';
import type { IPlanDoubt } from '@/shared/types';

/** As dúvidas do plano que a revisão acrescentou, pelo id que elas ganharam. */
export function reviewDoubtsOf(props: {
  review: IChangeReview;
  doubts: IPlanDoubt[];
}): { id: string; question: string }[] {
  return props.review.items.flatMap((item) => {
    if (item.kind !== 'doubt' || item.state !== 'applied') return [];

    const kept = props.doubts.find(
      ({ question }) => question.trim() === item.question.trim(),
    );

    return kept === undefined ? [] : [{ id: kept.id, question: kept.question }];
  });
}
