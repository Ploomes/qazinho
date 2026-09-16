import { describe, expect, it } from 'vitest';
import { finishRun, landStep, stopRun } from '@/modules/Workspace/library';
import { makeOutcome, makeWorkspace, walkRun } from './fixtures';

describe('stopRun', () => {
  it('ends the run at once, with the device dark and the workspace stopped', () => {
    const walked = walkRun({ verdicts: ['passed'] });
    const stopped = stopRun({
      ...walked,
      live: { ...walked.live!, doingIndex: 1, streamUrl: 'http://x' },
    });

    expect(stopped.status).toBe('stopped');
    expect(stopped.live).toMatchObject({
      isRunning: false,
      isDone: true,
      doingIndex: -1,
      streamUrl: null,
    });
  });

  it('does NOT file a run or a verdict for what arrives after the stop', () => {
    const stopped = stopRun(walkRun({ verdicts: ['passed'] }));
    const late = landStep({
      workspace: stopped,
      outcome: makeOutcome({ workspace: stopped, index: 1, verdict: 'failed' }),
      at: '09:43',
    });
    const done = finishRun({ workspace: late, at: '09:43' });

    expect(done.runs).toEqual([]);
    expect(done.bugs).toEqual([]);
    expect(done.status).toBe('stopped');
  });

  it('leaves a workspace with no run in flight alone', () => {
    const finished = walkRun({ verdicts: ['passed'], isFinished: true });

    expect(stopRun(finished)).toBe(finished);
    expect(stopRun(makeWorkspace())).toEqual(makeWorkspace());
  });
});
