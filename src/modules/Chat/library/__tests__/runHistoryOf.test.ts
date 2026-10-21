import type { IRun } from '@/modules/Run';
import { describe, expect, it } from 'vitest';
import { runHistoryOf } from '@/modules/Chat/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const WALKED = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });
const RUN = WALKED.runs[0]!;

const run = (id: string): IRun => ({ ...RUN, id });

describe('runHistoryOf', () => {
  it('gives the latest run whole, with the notes its agent left', () => {
    const [latest] = runHistoryOf({
      workspace: {
        runs: [RUN],
        chat: [
          {
            id: 'm-1',
            kind: 'note',
            at: '09:41',
            runId: 'r-01',
            who: 'Codex',
            text: 'Closed a banner.',
          },
          {
            id: 'm-2',
            kind: 'note',
            at: '09:41',
            runId: 'r-00',
            who: 'Codex',
            text: 'Another run.',
          },
        ],
      },
      wholePlan: 'The whole plan',
      exploration: 'Exploration',
    });

    expect(latest).toMatchObject({
      kind: 'run',
      id: 'r-01',
      title: 'The whole plan · 09:41',
    });
    expect(latest?.facts).toContain('  step 1 passed: Open the target URL');
    expect(latest?.facts.at(-1)).toBe('note: Closed a banner.');
    expect(latest?.facts).not.toContain('note: Another run.');
  });

  it('keeps the runs before it by what broke, and only the latest five', () => {
    const history = runHistoryOf({
      workspace: {
        runs: ['r-07', 'r-06', 'r-05', 'r-04', 'r-03', 'r-02'].map(run),
        chat: [],
      },
      wholePlan: 'The whole plan',
      exploration: 'Exploration',
    });

    expect(history.map(({ id }) => id)).toEqual(['r-07', 'r-06', 'r-05', 'r-04', 'r-03']);
    expect(history[1]?.facts).not.toContain('  step 1 passed: Open the target URL');
    expect(history[1]?.facts.some((fact) => fact.includes('failed:'))).toBe(true);
  });

  it('has nothing to tell before the first run', () => {
    expect(
      runHistoryOf({
        workspace: { runs: [], chat: [] },
        wholePlan: 'x',
        exploration: 'Exploration',
      }),
    ).toEqual([]);
  });
});
