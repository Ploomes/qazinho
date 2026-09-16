import { describe, expect, it } from 'vitest';
import { landStep, startRun } from '@/modules/Workspace/library';
import { makeOutcome, makeWorkspace, walkRun } from './fixtures';

describe('landStep', () => {
  it('keeps what the device decided, in the order it decided it', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'] });

    expect(workspace.live?.outcomes.map(({ verdict }) => verdict)).toEqual([
      'passed',
      'failed',
    ]);
  });

  it('shows the last screenshot the device sent back', () => {
    const workspace = walkRun({ verdicts: ['passed', 'passed'] });

    expect(workspace.live?.shot).toBe('data:image/jpeg;base64,shot-1');
  });

  it('a step with no screenshot leaves the one before it on screen', () => {
    const walked = walkRun({ verdicts: ['passed'] });

    const workspace = landStep({
      workspace: walked,
      outcome: makeOutcome({ workspace: walked, index: 1, verdict: 'skipped' }),
      at: '09:42',
    });

    expect(workspace.live?.shot).toBe('data:image/jpeg;base64,shot-0');
  });

  it('a failed step becomes a bug; a passed one does not', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'] });

    expect(workspace.bugs).toHaveLength(1);
    expect(workspace.bugs[0]?.step).toBe('step 2');
  });

  it('a step that lands with nothing running is ignored', () => {
    const idle = makeWorkspace();

    const workspace = landStep({
      workspace: idle,
      outcome: makeOutcome({ workspace: idle, index: 0, verdict: 'failed' }),
      at: '09:41',
    });

    expect(workspace).toBe(idle);
  });

  it('stops claiming to be on a step once that step came back', () => {
    const started = startRun({
      workspace: makeWorkspace(),
      startedAt: '09:41',
      runId: 'r-01',
    });
    const doing = { ...started, live: { ...started.live!, doingIndex: 0 } };

    const workspace = landStep({
      workspace: doing,
      outcome: makeOutcome({ workspace: doing, index: 0, verdict: 'passed' }),
      at: '09:41',
    });

    expect(workspace.live?.doingIndex).toBe(-1);
  });
});
