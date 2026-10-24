import { describe, expect, it } from 'vitest';
import { bugBodyOf } from '@/main/classes/pro/ProSync/library';
import { BUG } from './fixtures';

describe('bugBodyOf', () => {
  it('keeps the screens that went up, by their keys, and each sighting with its own', () => {
    const body = bugBodyOf({
      bug: BUG,
      keys: { '/data/runs/w1/r1/2.jpg': 'ev/1', '/data/runs/w1/r2/2.jpg': 'ev/2' },
    });

    expect(body.shots).toEqual([{ key: 'ev/1', isBad: true }]);
    expect(body.sightings[0]).toMatchObject({ runId: 'r2', shot: 'ev/2' });
    expect(body.sightings[0]).not.toHaveProperty('shotFile');
  });

  it('leaves out a screen that never went up', () => {
    expect(bugBodyOf({ bug: BUG, keys: {} }).shots).toEqual([]);
  });
});
