import type { CaseChoice, ICaseClash } from '@/modules/Pro/types';
import type { IProSyncCase } from '@/shared/types';
import { freeCaseIdOf } from './freeCaseIdOf';

/**
 * Junta o plano daqui e o da org caso a caso, a partir do último acordo; um caso que os
 * dois mudaram é um choque, mantido como o QA escolheu ou como está aqui.
 */
export function mergeCases(props: {
  base: IProSyncCase[];
  mine: IProSyncCase[];
  theirs: IProSyncCase[];
  choices?: Record<string, CaseChoice>;
}): { cases: IProSyncCase[]; clashes: ICaseClash[] } {
  const byId = (cases: IProSyncCase[]) => new Map(cases.map((one) => [one.id, one]));
  const base = byId(props.base);
  const mine = byId(props.mine);
  const theirs = byId(props.theirs);
  const ids = [
    ...new Set([
      ...props.mine.map(({ id }) => id),
      ...props.theirs.map(({ id }) => id).filter((id) => !mine.has(id)),
    ]),
  ];
  const taken = [...ids];
  const clashes: ICaseClash[] = [];

  const cases = ids.flatMap((id) => {
    const was = base.get(id);
    const here = mine.get(id);
    const there = theirs.get(id);

    if (
      was === undefined &&
      here !== undefined &&
      there !== undefined &&
      !sameCase(here, there)
    ) {
      const free = freeCaseIdOf({ id, taken });

      taken.push(free);

      return [there, { ...here, id: free }];
    }

    const isBoth =
      !sameCase(here, was) && !sameCase(there, was) && !sameCase(here, there);

    if (isBoth) clashes.push({ id, mine: here ?? null, theirs: there ?? null });

    const choice = props.choices?.[id];
    const kept = isBoth
      ? choice === 'theirs'
        ? there
        : here
      : sameCase(here, was) && !sameCase(there, was)
        ? there
        : here;

    return kept === undefined ? [] : [kept];
  });

  return { cases, clashes };
}

function sameCase(
  one: IProSyncCase | undefined,
  other: IProSyncCase | undefined,
): boolean {
  const said = (testCase: IProSyncCase | undefined) =>
    testCase === undefined
      ? null
      : JSON.stringify([
          testCase.id,
          testCase.title,
          testCase.priority,
          testCase.goal,
          testCase.preconditions,
          testCase.steps.map(({ action, expected, frame }) => [
            action,
            expected,
            frame ?? null,
          ]),
          testCase.isManual === true,
        ]);

  return said(one) === said(other);
}
