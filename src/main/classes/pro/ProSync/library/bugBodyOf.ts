import type { IProSyncBug } from '@/shared/types';

/** The bug as the platform takes it, each screen named by the key it was uploaded under; a screen that did not go up is left out. */
export function bugBodyOf(props: { bug: IProSyncBug; keys: Record<string, string> }) {
  const { bug, keys } = props;
  const keyOf = (file: string | null) => (file === null ? null : (keys[file] ?? null));

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
    sightings: bug.sightings.map(({ shotFile, ...sighting }) => ({
      ...sighting,
      shot: keyOf(shotFile),
    })),
    firstSeenAt: bug.firstSeenAt,
  };
}
