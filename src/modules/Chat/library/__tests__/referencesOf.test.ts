import { describe, expect, it } from 'vitest';
import { referencesOf } from '@/modules/Chat/library';
import { endRun } from '@/modules/Workspace/library';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

describe('referencesOf', () => {
  it('offers the runs, the bugs and the cases of the workspace', () => {
    const workspace = walkRun({
      verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
      isFinished: true,
    });

    expect(
      referencesOf({
        workspace,
        wholePlan: 'The whole plan',
        exploration: 'Exploration',
      }).map(({ kind, id }) => `${kind} ${id}`),
    ).toEqual(['run r-01', 'bug BUG-01', 'case TC-01', 'case TC-02']);
  });

  it('gives a run the verdict of every step, so the agent can explain it', () => {
    const workspace = walkRun({
      verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
      isFinished: true,
    });
    const [run] = referencesOf({
      workspace,
      wholePlan: 'The whole plan',
      exploration: 'Exploration',
    });

    expect(run?.facts).toContain('steps: 4 passed, 1 failed, 0 blocked, 1 skipped');
    expect(run?.facts.some((fact) => fact.includes('step 2 failed'))).toBe(true);
  });

  it('says how a run ended, so the agent never takes a stopped run for the whole plan', () => {
    const finished = walkRun({ verdicts: ['passed'], isFinished: true });
    const stopped = endRun({
      workspace: walkRun({ verdicts: ['passed'] }),
      at: '09:43',
      endedBy: 'stopped',
    });

    expect(
      referencesOf({
        workspace: finished,
        wholePlan: 'The whole plan',
        exploration: 'Exploration',
      })[0]?.facts[0],
    ).toMatch(/walked to the end$/);
    expect(
      referencesOf({
        workspace: stopped,
        wholePlan: 'The whole plan',
        exploration: 'Exploration',
      })[0]?.facts[0],
    ).toMatch(/stopped by the QA before the end$/);
  });

  it("tells runs of the same plan apart by when they started, named in the QA's language", () => {
    const workspace = walkRun({ verdicts: ['passed'], isFinished: true });
    const [run] = referencesOf({
      workspace,
      wholePlan: 'O plano inteiro',
      exploration: 'Exploration',
    });

    expect(run?.title).toBe('O plano inteiro · 09:41');
  });

  it('has only the plan to offer before anything ran', () => {
    expect(
      referencesOf({
        workspace: makeWorkspace(),
        wholePlan: 'The whole plan',
        exploration: 'Exploration',
      }).every(({ kind }) => kind === 'case'),
    ).toBe(true);
  });
});
