import type { IBug } from '@/modules/Bug/types';

/**
 * O bug já aberto que uma falha ou um achado é: o que o agente dele nomeou, o em que o
 * passo do plano falhou antes, ou um com o mesmo título; null quando é novo.
 */
export function openBugFor(props: {
  bugs: IBug[];
  sameAs: string | undefined;
  caseId: string;
  stepNumber: number;
  title: string;
  isIncidental: boolean;
}): IBug | null {
  const { bugs, sameAs, caseId, stepNumber, title, isIncidental } = props;
  const words = wordsOf(title);

  return (
    (sameAs === undefined ? undefined : bugs.find(({ id }) => id === sameAs)) ??
    (isIncidental
      ? undefined
      : bugs.find(
          (bug) =>
            !bug.isIncidental && bug.caseId === caseId && bug.stepNumber === stepNumber,
        )) ??
    (words.length === 0 ? undefined : bugs.find((bug) => wordsOf(bug.title) === words)) ??
    null
  );
}

function wordsOf(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}
