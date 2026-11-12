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

  /**
   * Uma exploração anota a tela em que chegou: a tela vale dali em diante. Contada para
   * trás, o painel marcava "Termos de Uso" enquanto o vídeo ainda mostrava a página anterior.
   */
  it('gives each explored screen the time from its note until the next one', () => {
    const workspace = recorded(VERDICTS);
    const base = workspace.runs[0]!;
    const step = base.cases[0]!.steps[0]!;
    const startedAt = base.video!.startedAt;
    const screen = (props: {
      number: number;
      action: string;
      from: number;
      to: number;
    }) => ({
      ...step,
      number: props.number,
      action: props.action,
      bugId: null,
      span: { from: startedAt + props.from, to: startedAt + props.to },
    });
    const run = {
      ...base,
      kind: 'explore' as const,
      video: { ...base.video!, durationMs: 38_971 },
      cases: [
        {
          ...base.cases[0]!,
          id: 'EX',
          steps: [
            screen({ number: 1, action: 'Home', from: 2, to: 3_634 }),
            screen({ number: 2, action: 'Blog', from: 3_634, to: 15_518 }),
            screen({ number: 3, action: 'Termos de Uso', from: 15_518, to: 35_741 }),
          ],
        },
      ],
    };

    expect(
      replayTimelineOf({ run, bugs: [] })?.chapters[0]?.steps.map(
        ({ action, fromMs, toMs }) => [action, fromMs, toMs],
      ),
    ).toEqual([
      ['Home', 2, 15_518],
      ['Blog', 15_518, 35_741],
      ['Termos de Uso', 35_741, 38_971],
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

  it('pins a bug an older run caught at the moment this run caught it again', () => {
    const workspace = recorded(VERDICTS);
    const [bug] = workspace.bugs;
    const bugs = [
      {
        ...bug!,
        runId: 'r-09',
        at: 1_759_000_000_000,
        sightings: [
          {
            runId: 'r-01',
            runWhen: '09:41',
            caseId: 'TC-02',
            stepNumber: 2,
            at: 1_760_000_010_000,
            shot: { isBad: true, src: null, file: null },
          },
        ],
      },
    ];

    expect(replayTimelineOf({ run: workspace.runs[0]!, bugs })?.marks).toEqual([
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

  it('has nothing to lay out for a run with no recording', () => {
    const walked = walkRun({ verdicts: ['passed'], isFinished: true });

    expect(replayTimelineOf({ run: walked.runs[0]!, bugs: [] })).toBeNull();
  });
});
