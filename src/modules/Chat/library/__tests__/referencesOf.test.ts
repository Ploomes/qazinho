import { describe, expect, it } from 'vitest';
import { referencesOf } from '@/modules/Chat/library';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

describe('referencesOf', () => {
  it('offers the runs, the bugs and the cases of the workspace', () => {
    const workspace = walkRun({
      verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
      isFinished: true,
    });

    expect(referencesOf(workspace).map(({ kind, id }) => `${kind} ${id}`)).toEqual([
      'run r-01',
      'bug BUG-01',
      'case TC-01',
      'case TC-02',
    ]);
  });

  it('gives a run the verdict of every step, so the agent can explain it', () => {
    const workspace = walkRun({
      verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
      isFinished: true,
    });
    const [run] = referencesOf(workspace);

    expect(run?.facts).toContain('4 passed, 1 failed, 0 blocked, 1 skipped');
    expect(run?.facts.some((fact) => fact.includes('step 2 failed'))).toBe(true);
  });

  it('tells runs of the same plan apart by when they started', () => {
    const workspace = walkRun({ verdicts: ['passed'], isFinished: true });
    const [run] = referencesOf(workspace);

    expect(run?.title).toBe(
      `${workspace.runs[0]?.what ?? ''} · ${workspace.runs[0]?.startedAt ?? ''}`,
    );
  });

  it('has only the plan to offer before anything ran', () => {
    expect(referencesOf(makeWorkspace()).every(({ kind }) => kind === 'case')).toBe(true);
  });
});
