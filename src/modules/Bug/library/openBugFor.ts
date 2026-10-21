import type { IBug } from '@/modules/Bug/types';

function wordsOf(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** The bug already open that a failure or a finding is: the one its agent named, the one its plan step failed for before, or one with the same title; null when it is new. */
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
