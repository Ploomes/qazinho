import type { IChangeReview, ITestCase } from '@/modules/Plan/types';

/**
 * O comentário que conta à história o que o plano decidiu sobre uma mudança: a abertura,
 * os casos que mudaram, os novos e as dúvidas, um por linha.
 */
export function storyNoteOf(props: {
  review: IChangeReview;
  plan: ITestCase[];
  words: {
    intro: (summary: string) => string;
    changed: (props: { id: string; title: string; why: string }) => string;
    added: (title: string) => string;
    doubt: (question: string) => string;
  };
}): string {
  const { review, plan, words } = props;
  const lines = review.items
    .filter(({ state }) => state === 'applied')
    .map((item) => {
      if (item.kind === 'doubt') return words.doubt(item.question);

      if (item.kind === 'add') return words.added(item.case.title);

      const kept = plan.find(({ id }) => id === item.caseId);

      return words.changed({
        id: item.caseId,
        title: kept?.title ?? item.case.title,
        why: item.why,
      });
    });

  return [words.intro(review.summary), ...lines.map((line) => `- ${line}`)].join('\n');
}
