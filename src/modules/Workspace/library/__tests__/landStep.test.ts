import { describe, expect, it } from 'vitest';
import { landStep, startRun } from '@/modules/Workspace/library';
import { makeOutcome, makeWorkspace, WALKED_BY, walkRun } from './fixtures';

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
    expect(workspace.bugs[0]?.stepNumber).toBe(2);
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
      by: WALKED_BY,
    });
    const doing = { ...started, live: { ...started.live!, doingIndex: 0 } };

    const workspace = landStep({
      workspace: doing,
      outcome: makeOutcome({ workspace: doing, index: 0, verdict: 'passed' }),
      at: '09:41',
    });

    expect(workspace.live?.doingIndex).toBe(-1);
  });

  /**
   * A r-02 falhou o mesmo passo que a r-01 e a aba Bugs mostrava BUG-01 e BUG-02, quase
   * iguais.
   */
  it('lands a step that fails again on the bug it failed for before, seen in two runs', () => {
    const second = startRun({
      workspace: walkRun({
        verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
        isFinished: true,
      }),
      startedAt: '10:05',
      runId: 'r-02',
      by: WALKED_BY,
    });
    const workspace = landStep({
      workspace: second,
      outcome: {
        ...makeOutcome({ workspace: second, index: 4, verdict: 'failed' }),
        title: 'Submit does nothing',
      },
      at: '10:06',
    });

    expect(workspace.bugs.map(({ id }) => id)).toEqual(['BUG-01']);
    expect(workspace.bugs[0]).toMatchObject({ seenRuns: 2, isNew: true });
  });
});
