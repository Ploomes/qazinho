import type { IPlanDoubt } from '@/shared/types';

/** Os ids dos comentários que o QAzinho postou na história, pelo endereço de cada um. */
export function postedCommentsOf(props: {
  doubts: IPlanDoubt[];
  told: string[];
}): string[] {
  const urls = [
    ...props.doubts.flatMap(({ sent }) => (sent === null ? [] : [sent.url])),
    ...props.told,
  ];

  return [
    ...new Set(
      urls.flatMap((url) => {
        const id = /[?&]focusedCommentId=(\d+)/.exec(url)?.[1];

        return id === undefined ? [] : [id];
      }),
    ),
  ];
}
