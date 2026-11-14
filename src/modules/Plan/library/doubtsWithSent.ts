import type { IPlanDoubt } from '@/shared/types';

/**
 * As dúvidas depois de o comentário ir à história: as mandadas com onde ele fica e as
 * palavras com que o QA as mandou.
 */
export function doubtsWithSent(props: {
  doubts: IPlanDoubt[];
  sent: { url: string; at: string };
  questions: { id: string; question: string }[];
}): IPlanDoubt[] {
  return props.doubts.map((doubt) => {
    const asked = props.questions.find(({ id }) => id === doubt.id);

    return asked === undefined || doubt.sent !== null
      ? doubt
      : { ...doubt, question: asked.question.trim() || doubt.question, sent: props.sent };
  });
}
