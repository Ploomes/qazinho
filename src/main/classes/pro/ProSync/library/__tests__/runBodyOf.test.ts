import { describe, expect, it } from 'vitest';
import { runBodyOf } from '@/main/classes/pro/ProSync/library';
import { RUN } from './fixtures';

describe('runBodyOf', () => {
  it('names each screen and the video by the key it went up under', () => {
    const body = runBodyOf({
      run: RUN,
      videoFile: '/data/runs/w1/r1/run.mp4',
      networkFile: null,
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
      networkFile: null,
      keys: {},
      machine: 'MacBook-Ana',
    });

    expect(body.cases[0]?.steps[1]?.shot).toBeNull();
    expect(body.video).toBeNull();
  });

  it("names the run's requests by their key, and says when its video started", () => {
    const body = runBodyOf({
      run: { ...RUN, videoStartedAt: '2026-10-24T10:00:01.500Z' },
      videoFile: null,
      networkFile: '/data/runs/w1/r1/network.json',
      keys: { '/data/runs/w1/r1/network.json': 'ev/network' },
      machine: 'MacBook-Ana',
    });

    expect(body.network).toBe('ev/network');
    expect(body.videoStartedAt).toBe('2026-10-24T10:00:01.500Z');
  });
});
