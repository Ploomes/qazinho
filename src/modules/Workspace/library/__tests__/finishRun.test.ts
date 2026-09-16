import { describe, expect, it } from 'vitest';
import { finishRun, startRun } from '@/modules/Workspace/library';
import { makeWorkspace, walkRun } from './fixtures';

describe('finishRun', () => {
  it('files the run and tells the chat how it went', () => {
    const workspace = walkRun({ verdicts: ['passed', 'passed'], isFinished: true });

    expect(workspace.runs).toHaveLength(1);
    expect(workspace.chat.at(-1)).toMatchObject({
      kind: 'run',
      runId: 'r-01',
      passed: 2,
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

  it('a run that decided nothing is stopped, not filed', () => {
    const started = startRun({
      workspace: makeWorkspace(),
      startedAt: '09:41',
      runId: 'r-01',
    });

    const workspace = finishRun({ workspace: started, at: '09:41' });

    expect(workspace.runs).toEqual([]);
    expect(workspace.status).toBe('stopped');
    expect(workspace.live?.isDone).toBe(true);
  });

  it('finishing twice does not file the run twice', () => {
    const done = walkRun({ verdicts: ['passed'], isFinished: true });

    expect(finishRun({ workspace: done, at: '09:43' })).toBe(done);
  });
});
