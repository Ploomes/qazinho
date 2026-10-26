import type { IProSyncBug, IProSyncCatch } from '@/shared/types';

/** The bug as the platform takes it, each screen, its first catch's and each sighting's named by the key it was uploaded under; a screen that did not go up is left out. */
export function bugBodyOf(props: { bug: IProSyncBug; keys: Record<string, string> }) {
  const { bug, keys } = props;
  const keyOf = (file: string | null) => (file === null ? null : (keys[file] ?? null));
  const catchOf = ({ shotFile, ...seen }: IProSyncCatch) => ({
    ...seen,
    shot: keyOf(shotFile),
  });

  return {
    severity: bug.severity,
    title: bug.title,
    body: bug.body,
    expected: bug.expected,
    got: bug.got,
    caseId: bug.caseId,
    caseTitle: bug.caseTitle,
    stepNumber: bug.stepNumber,
    target: bug.target,
    isIncidental: bug.isIncidental,
    isDismissed: bug.isDismissed,
    filed: bug.filed,
    repro: bug.repro,
    shots: bug.shots.flatMap(({ file, isBad }) => {
      const key = keyOf(file);

      return key === null ? [] : [{ key, isBad }];
    }),
    caught: bug.caught === null ? null : catchOf(bug.caught),
    sightings: bug.sightings.map(catchOf),
    firstSeenAt: bug.firstSeenAt,
  };
}
