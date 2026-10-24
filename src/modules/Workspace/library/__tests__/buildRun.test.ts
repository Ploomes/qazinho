import type { StepVerdict } from '@/modules/Run';
import { describe, expect, it } from 'vitest';
import { buildRun, landStep, startRun } from '@/modules/Workspace/library';
import { makeOutcome, WALKED_BY, walkRun } from './fixtures';

const VERDICTS: StepVerdict[] = [
  'passed',
  'passed',
  'passed',
  'passed',
  'failed',
  'skipped',
];

describe('buildRun', () => {
  it('groups the steps back under the case they came from', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: VERDICTS }),
      endedBy: 'finished',
    });

    expect(run.cases.map(({ id }) => id)).toEqual(['TC-01', 'TC-02']);
    expect(run.cases[0]?.steps).toHaveLength(3);
  });

  it('fails a case as soon as one of its steps did not pass', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: VERDICTS }),
      endedBy: 'finished',
    });

    expect(run.cases[0]?.verdict).toBe('passed');
    expect(run.cases[1]?.verdict).toBe('failed');
  });

  it('keeps how a step was walked without the agent, and the words that proved it', () => {
    const walked = walkRun({ verdicts: ['passed', 'passed', 'passed'] });
    const live = walked.live;

    if (live === null) throw new Error('fixture');

    const run = buildRun({
      workspace: {
        ...walked,
        live: {
          ...live,
          outcomes: live.outcomes.map((outcome, position) =>
            position === 0
              ? { ...outcome, by: 'replay' as const, got: 'Results: 3' }
              : { ...outcome, by: 'healed' as const },
          ),
        },
      },
      endedBy: 'finished',
    });

    expect(run.cases[0]?.steps.map(({ by, proof }) => [by, proof])).toEqual([
      ['replay', 'Results: 3'],
      ['healed', undefined],
      ['healed', undefined],
    ]);
  });

  it('carries the note the agent left on a step that did not pass', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: VERDICTS }),
      endedBy: 'finished',
    });
    const skipped = run.cases[1]?.steps.find(({ verdict }) => verdict === 'skipped');

    expect(skipped?.why).toBe('The page did not do it.');
  });

  it('points the failed step at the bug it became', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: VERDICTS }),
      endedBy: 'finished',
    });
    const failed = run.cases[1]?.steps.find(({ verdict }) => verdict === 'failed');

    expect(failed?.bugId).toBe('BUG-01');
  });

  it('leaves out a case the run never reached', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: ['passed', 'passed', 'passed'] }),
      endedBy: 'finished',
    });

    expect(run.cases.map(({ id }) => id)).toEqual(['TC-01']);
    expect(run.cases[0]?.steps).toHaveLength(3);
  });

  /**
   * A stop in the middle of a case left it reading "passed" in the run's report, with only the
   * first of its steps walked.
   */
  it('skips the steps a stop left unwalked, so a case cut short never reads passed', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: ['passed', 'passed'] }),
      endedBy: 'stopped',
    });

    expect(run.cases[0]).toMatchObject({ verdict: 'skipped' });
    expect(
      run.cases[0]?.steps.map(({ number, verdict, span }) => [number, verdict, span]),
    ).toEqual([
      [1, 'passed', { from: 1_760_000_000_000, to: 1_760_000_002_000 }],
      [2, 'passed', { from: 1_760_000_002_000, to: 1_760_000_004_000 }],
      [3, 'skipped', null],
    ]);
    expect(run.counts).toEqual({ passed: 2, failed: 0, blocked: 0, skipped: 1 });
  });

  it('says how the run ended', () => {
    expect(
      buildRun({ workspace: walkRun({ verdicts: ['passed'] }), endedBy: 'stopped' })
        .endedBy,
    ).toBe('stopped');
  });

  it('keeps the moment the run started, and leaves it out for a run that never knew it', () => {
    const started = startRun({
      workspace: walkRun({ verdicts: [] }),
      startedAt: '09:41',
      startedAtMs: 1_760_000_000_000,
      runId: 'r-01',
      by: WALKED_BY,
    });

    expect(buildRun({ workspace: started, endedBy: 'finished' }).startedAtMs).toBe(
      1_760_000_000_000,
    );
    expect(
      buildRun({ workspace: walkRun({ verdicts: ['passed'] }), endedBy: 'finished' }),
    ).not.toHaveProperty('startedAtMs');
  });

  it('carries the run id the device was told to use', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: VERDICTS }),
      endedBy: 'finished',
    });

    expect(run.id).toBe('r-01');
  });

  it('places each step in time, from when it began to when it came back', () => {
    const run = buildRun({
      workspace: walkRun({ verdicts: ['passed', 'passed', 'passed'] }),
      endedBy: 'finished',
    });

    expect(run.cases[0]?.steps.map(({ span }) => span)).toEqual([
      { from: 1_760_000_000_000, to: 1_760_000_002_000 },
      { from: 1_760_000_002_000, to: 1_760_000_004_000 },
      { from: 1_760_000_004_000, to: 1_760_000_006_000 },
    ]);
  });

  it('leaves the recording for later, since it is written after the run ends', () => {
    expect(
      buildRun({ workspace: walkRun({ verdicts: ['passed'] }), endedBy: 'finished' })
        .video,
    ).toBeNull();
  });

  it('points a step that failed again at the bug already open, not at nothing', () => {
    const second = startRun({
      workspace: walkRun({
        verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
        isFinished: true,
      }),
      startedAt: '10:05',
      runId: 'r-02',
      by: WALKED_BY,
    });
    const walked = landStep({
      workspace: second,
      outcome: makeOutcome({ workspace: second, index: 4, verdict: 'failed' }),
      at: '10:06',
    });
    const run = buildRun({ workspace: walked, endedBy: 'finished' });

    expect(run.cases.find(({ id }) => id === 'TC-02')?.steps[1]?.bugId).toBe('BUG-01');
  });
});
