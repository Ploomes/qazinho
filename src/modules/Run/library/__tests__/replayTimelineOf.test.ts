import type { StepVerdict } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { replayTimelineOf } from '@/modules/Run/library';
import { recordedRun, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const recorded = (verdicts: StepVerdict[]) => recordedRun(verdicts);

const VERDICTS: StepVerdict[] = [
  'passed',
  'passed',
  'passed',
  'passed',
  'failed',
  'skipped',
];

describe('replayTimelineOf', () => {
  it('lays a case out as a chapter, from its first step to its last, in ms of the video', () => {
    const workspace = recorded(VERDICTS);
    const timeline = replayTimelineOf({ run: workspace.runs[0]!, bugs: workspace.bugs });

    expect(timeline?.durationMs).toBe(12_000);
    expect(
      timeline?.chapters.map(({ caseId, fromMs, toMs }) => [caseId, fromMs, toMs]),
    ).toEqual([
      ['TC-01', 0, 5_500],
      ['TC-02', 5_500, 11_500],
    ]);
  });

  it('places each step and keeps its verdict and the bug it became', () => {
    const workspace = recorded(VERDICTS);
    const steps = replayTimelineOf({ run: workspace.runs[0]!, bugs: workspace.bugs })
      ?.chapters[1]?.steps;

    expect(
      steps?.map(({ number, verdict, fromMs, toMs, bugId }) => [
        number,
        verdict,
        fromMs,
        toMs,
        bugId,
      ]),
    ).toEqual([
      [1, 'passed', 5_500, 7_500, null],
      [2, 'failed', 7_500, 9_500, 'BUG-01'],
      [3, 'skipped', 9_500, 11_500, null],
    ]);
  });

  it('pins each bug of the run at the moment it was caught', () => {
    const workspace = recorded(VERDICTS);

    expect(
      replayTimelineOf({ run: workspace.runs[0]!, bugs: workspace.bugs })?.marks,
    ).toEqual([
      {
        bugId: 'BUG-01',
        title: 'Nothing happens on submit',
        severity: 'high',
        atMs: 9_500,
        caseId: 'TC-02',
        stepNumber: 2,
      },
    ]);
  });

  it('holds a moment from before the first frame at the start of the video', () => {
    const workspace = recorded(['passed']);

    expect(
      replayTimelineOf({ run: workspace.runs[0]!, bugs: [] })?.chapters[0]?.fromMs,
    ).toBe(0);
  });

  it('leaves out the bugs of other runs and one caught at no known moment', () => {
    const workspace = recorded(VERDICTS);
    const [bug] = workspace.bugs;
    const bugs = [
      { ...bug!, runId: 'r-09' },
      { ...bug!, id: 'BUG-02', at: null },
    ];

    expect(replayTimelineOf({ run: workspace.runs[0]!, bugs })?.marks).toEqual([]);
  });

  it('has nothing to lay out for a run with no recording', () => {
    const walked = walkRun({ verdicts: ['passed'], isFinished: true });

    expect(replayTimelineOf({ run: walked.runs[0]!, bugs: [] })).toBeNull();
  });
});
