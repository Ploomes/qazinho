import { describe, expect, it } from 'vitest';
import { endRun, landStep, startRun } from '@/modules/Workspace/library';
import { makeOutcome, makeWorkspace, WALKED_BY, walkRun } from './fixtures';

describe('endRun', () => {
  describe('a run that walked the whole plan', () => {
    it('files the run and tells the chat how it went', () => {
      const workspace = walkRun({ verdicts: ['passed', 'passed'], isFinished: true });

      expect(workspace.runs).toHaveLength(1);
      expect(workspace.runs[0]?.endedBy).toBe('finished');
      expect(workspace.chat.at(-1)).toMatchObject({
        kind: 'run',
        runId: 'r-01',
        passed: 2,
        endedBy: 'finished',
      });
    });

    it('a plan that came back clean leaves the workspace passed', () => {
      const workspace = walkRun({ verdicts: ['passed', 'passed'], isFinished: true });

      expect(workspace.status).toBe('passed');
    });

    it('one failure is enough to leave the workspace failed', () => {
      const workspace = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });

      expect(workspace.status).toBe('failed');
    });

    it('a step nobody could carry out is not a pass either', () => {
      const workspace = walkRun({ verdicts: ['passed', 'blocked'], isFinished: true });

      expect(workspace.status).toBe('failed');
    });

    it('the plan carries how each case went, so the QA sees it without opening the run', () => {
      const workspace = walkRun({
        verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
        isFinished: true,
      });

      expect(workspace.plan[0]?.lastVerdict).toBe('passed');
      expect(workspace.plan[1]?.lastVerdict).toBe('failed');
    });

    it('a case the run never reached keeps the verdict it already had', () => {
      const workspace = walkRun({ verdicts: ['passed', 'passed'], isFinished: true });

      expect(workspace.plan[1]?.lastVerdict).toBeNull();
    });

    it('ending twice does not file the run twice', () => {
      const done = walkRun({ verdicts: ['passed'], isFinished: true });

      expect(endRun({ workspace: done, at: '09:43', endedBy: 'finished' })).toBe(done);
    });
  });

  describe('a run the QA stopped', () => {
    it('ends at once, with the device dark and the workspace stopped', () => {
      const walked = walkRun({ verdicts: ['passed'] });
      const stopped = endRun({
        workspace: {
          ...walked,
          live: { ...walked.live!, doingIndex: 1, streamUrl: 'http://x' },
        },
        at: '09:43',
        endedBy: 'stopped',
      });

      expect(stopped.status).toBe('stopped');
      expect(stopped.live).toMatchObject({
        isRunning: false,
        isDone: true,
        doingIndex: -1,
        streamUrl: null,
      });
    });

    /**
     * A stopped run used to be thrown away while the bugs its failures became stayed, each one
     * pointing at a run the list did not have.
     */
    it('is filed with what it walked before the stop, so its bugs have a run to point at', () => {
      const stopped = endRun({
        workspace: walkRun({ verdicts: ['passed', 'failed'] }),
        at: '09:43',
        endedBy: 'stopped',
      });

      expect(stopped.bugs[0]?.runId).toBe('r-01');
      expect(stopped.runs[0]).toMatchObject({
        id: 'r-01',
        endedBy: 'stopped',
        counts: { passed: 1, failed: 1 },
      });
      expect(stopped.chat.at(-1)).toMatchObject({ kind: 'run', endedBy: 'stopped' });
      expect(stopped.status).toBe('failed');
    });

    it('does NOT pass a case it left halfway, though every step it walked passed', () => {
      const stopped = endRun({
        workspace: walkRun({ verdicts: ['passed', 'passed'] }),
        at: '09:43',
        endedBy: 'stopped',
      });

      expect(stopped.status).toBe('stopped');
      expect(stopped.plan[0]?.lastVerdict).toBeNull();
    });

    it('does NOT file what arrives after the stop', () => {
      const stopped = endRun({
        workspace: walkRun({ verdicts: ['passed'] }),
        at: '09:43',
        endedBy: 'stopped',
      });
      const late = landStep({
        workspace: stopped,
        outcome: makeOutcome({ workspace: stopped, index: 1, verdict: 'failed' }),
        at: '09:43',
      });
      const done = endRun({ workspace: late, at: '09:43', endedBy: 'finished' });

      expect(done.runs).toHaveLength(1);
      expect(done.runs[0]).toMatchObject({
        endedBy: 'stopped',
        counts: { passed: 1, failed: 0 },
      });
      expect(done.bugs).toEqual([]);
    });
  });

  it('files a run that broke on the way, with what it walked', () => {
    const broke = endRun({
      workspace: walkRun({ verdicts: ['passed'] }),
      at: '09:43',
      endedBy: 'broke',
    });

    expect(broke.runs[0]?.endedBy).toBe('broke');
    expect(broke.status).toBe('stopped');
  });

  it('keeps one record per run, the last word on it', () => {
    const interrupted = endRun({
      workspace: walkRun({ verdicts: ['passed'] }),
      at: '09:43',
      endedBy: 'interrupted',
    });
    const again = startRun({
      workspace: interrupted,
      startedAt: '09:50',
      runId: 'r-01',
      by: WALKED_BY,
    });
    const walked = landStep({
      workspace: again,
      outcome: makeOutcome({ workspace: again, index: 0, verdict: 'passed' }),
      at: '09:50',
    });

    expect(
      endRun({ workspace: walked, at: '09:51', endedBy: 'finished' }).runs,
    ).toHaveLength(1);
  });

  it('a run that walked nothing is stopped, not filed', () => {
    const started = startRun({
      workspace: makeWorkspace(),
      startedAt: '09:41',
      runId: 'r-01',
      by: WALKED_BY,
    });

    const workspace = endRun({ workspace: started, at: '09:41', endedBy: 'stopped' });

    expect(workspace.runs).toEqual([]);
    expect(workspace.status).toBe('stopped');
    expect(workspace.live?.isDone).toBe(true);
  });

  it('leaves a workspace with no run in flight alone', () => {
    const finished = walkRun({ verdicts: ['passed'], isFinished: true });

    expect(endRun({ workspace: finished, at: '09:43', endedBy: 'stopped' })).toBe(
      finished,
    );
    expect(
      endRun({ workspace: makeWorkspace(), at: '09:43', endedBy: 'stopped' }),
    ).toEqual(makeWorkspace());
  });
});
