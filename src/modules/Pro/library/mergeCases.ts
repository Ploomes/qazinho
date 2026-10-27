import type { IProSyncCase } from '@/shared/types';
import { freeCaseIdOf } from './freeCaseIdOf';

/**
 * Joins this computer's plan and the org's case by case, from the cases both last agreed
 * on.
 */
export function mergeCases(props: {
  base: IProSyncCase[];
  mine: IProSyncCase[];
  theirs: IProSyncCase[];
}): IProSyncCase[] {
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

  return ids.flatMap((id) => {
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

    const kept = sameCase(here, was) && !sameCase(there, was) ? there : here;

    return kept === undefined ? [] : [kept];
  });
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
        ]);

  return said(one) === said(other);
}
