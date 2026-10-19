import type { IRunVideo } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { endRun, landVideo } from '@/modules/Workspace/library';
import { walkRun } from './fixtures';

const VIDEO: IRunVideo = {
  startedAt: 1_760_000_000_500,
  durationMs: 9_000,
  width: 1280,
  height: 800,
};

const ENDED = endRun({
  workspace: walkRun({ verdicts: ['passed', 'passed'], isFinished: false }),
  at: '09:42',
  endedBy: 'finished',
});

describe('landVideo', () => {
  it('gives the run its recording once it is written', () => {
    const workspace = landVideo({ workspace: ENDED, runId: 'r-01', video: VIDEO });

    expect(workspace.runs[0]?.video).toEqual(VIDEO);
  });

  it('does NOT touch a workspace with no run of that id', () => {
    expect(landVideo({ workspace: ENDED, runId: 'r-09', video: VIDEO })).toBe(ENDED);
  });
});
