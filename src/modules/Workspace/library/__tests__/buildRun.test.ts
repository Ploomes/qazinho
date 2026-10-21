import type { StepVerdict } from '@/modules/Run';
import { describe, expect, it } from 'vitest';
import { buildRun } from '@/modules/Workspace/library';
import { walkRun } from './fixtures';

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
});
