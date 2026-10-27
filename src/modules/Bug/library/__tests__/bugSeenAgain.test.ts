import type { IBugSighting } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { SIGHTINGS_KEPT } from '@/modules/Bug/constants';
import { bugSeenAgain } from '@/modules/Bug/library';
import { secondRun } from './fixtures';

const SIGHTING: IBugSighting = {
  runId: 'r-02',
  runWhen: '10:05',
  caseId: 'TC-02',
  stepNumber: 2,
  at: 1_760_000_100_000,
  shot: { isBad: true, src: null, file: '/tmp/qazinho/r-02/step-5.jpg' },
};

function firstBug() {
  const [bug] = secondRun().bugs;

  if (bug === undefined) throw new Error('r-01 caught no bug');

  return { ...bug, isNew: false };
}

describe('bugSeenAgain', () => {
  it('keeps the sighting and counts one more run, reading as just caught', () => {
    const bug = bugSeenAgain({ bug: firstBug(), sighting: SIGHTING });

    expect(bug.sightings).toEqual([SIGHTING]);
    expect(bug.seenRuns).toBe(2);
    expect(bug.isNew).toBe(true);
  });

  it('does NOT count a run twice when it caught the bug before', () => {
    const bug = bugSeenAgain({
      bug: firstBug(),
      sighting: { ...SIGHTING, runId: 'r-01' },
    });

    expect(bug.seenRuns).toBe(1);
  });

  it('keeps only its latest sightings, and still counts every run that caught it', () => {
    const seen = Array.from({ length: SIGHTINGS_KEPT }, (_, index) => ({
      ...SIGHTING,
      runId: `r-old-${String(index)}`,
    }));
    const bug = bugSeenAgain({
      bug: { ...firstBug(), sightings: seen, seenRuns: 140 },
      sighting: SIGHTING,
    });

    expect(bug.sightings).toHaveLength(SIGHTINGS_KEPT);
    expect(bug.sightings[0]?.runId).toBe('r-old-1');
    expect(bug.sightings.at(-1)).toEqual(SIGHTING);
    expect(bug.seenRuns).toBe(141);
  });
});
