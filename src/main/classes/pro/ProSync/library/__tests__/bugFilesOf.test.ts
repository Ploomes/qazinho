import { describe, expect, it } from 'vitest';
import { bugFilesOf } from '@/main/classes/pro/ProSync/library';
import { BUG } from './fixtures';

describe('bugFilesOf', () => {
  it('lists the bug’s own screens, then each sighting’s, once each', () => {
    expect(bugFilesOf(BUG)).toEqual(['/data/runs/w1/r1/2.jpg', '/data/runs/w1/r2/2.jpg']);
  });

  it('lists the screen of the run that first caught it when the bug kept none of its own', () => {
    expect(
      bugFilesOf({
        ...BUG,
        shots: [],
        sightings: [],
        caught: { ...BUG.caught!, shotFile: '/data/runs/w1/r1/3.jpg' },
      }),
    ).toEqual(['/data/runs/w1/r1/3.jpg']);
  });
});
