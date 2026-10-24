import { describe, expect, it } from 'vitest';
import { runBodyOf } from '@/main/classes/pro/ProSync/library';
import { RUN } from './fixtures';

describe('runBodyOf', () => {
  it('names each screen and the video by the key it went up under', () => {
    const body = runBodyOf({
      run: RUN,
      videoFile: '/data/runs/w1/r1/run.mp4',
      keys: {
        '/data/runs/w1/r1/2.jpg': 'ev/shot',
        '/data/runs/w1/r1/run.mp4': 'ev/video',
      },
      machine: 'MacBook-Ana',
    });

    expect(body.cases[0]?.steps.map(({ shot }) => shot)).toEqual([null, 'ev/shot']);
    expect(body.video).toBe('ev/video');
    expect(body.machine).toBe('MacBook-Ana');
    expect(body.cases[0]?.steps[0]).not.toHaveProperty('shotFile');
  });

  it('leaves a screen that did not go up as null rather than a path on this machine', () => {
    const body = runBodyOf({
      run: RUN,
      videoFile: '/data/runs/w1/r1/run.mp4',
      keys: {},
      machine: 'MacBook-Ana',
    });

    expect(body.cases[0]?.steps[1]?.shot).toBeNull();
    expect(body.video).toBeNull();
  });
});
