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
    const run = buildRun(walkRun({ verdicts: VERDICTS }));

    expect(run.cases.map(({ id }) => id)).toEqual(['TC-01', 'TC-02']);
    expect(run.cases[0]?.steps).toHaveLength(3);
  });

  it('fails a case as soon as one of its steps did not pass', () => {
    const run = buildRun(walkRun({ verdicts: VERDICTS }));

    expect(run.cases[0]?.verdict).toBe('passed');
    expect(run.cases[1]?.verdict).toBe('failed');
  });

  it('carries the note the agent left on a step that did not pass', () => {
    const run = buildRun(walkRun({ verdicts: VERDICTS }));
    const skipped = run.cases[1]?.steps.find(({ verdict }) => verdict === 'skipped');

    expect(skipped?.why).toBe('The page did not do it.');
  });

  it('points the failed step at the bug it became', () => {
    const run = buildRun(walkRun({ verdicts: VERDICTS }));
    const failed = run.cases[1]?.steps.find(({ verdict }) => verdict === 'failed');

    expect(failed?.bugId).toBe('BUG-01');
  });

  it('leaves out a case the run never reached', () => {
    const run = buildRun(walkRun({ verdicts: ['passed', 'passed'] }));

    expect(run.cases.map(({ id }) => id)).toEqual(['TC-01']);
    expect(run.cases[0]?.steps).toHaveLength(2);
  });

  it('carries the run id the device was told to use', () => {
    const run = buildRun(walkRun({ verdicts: VERDICTS }));

    expect(run.id).toBe('r-01');
  });
});
