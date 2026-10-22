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

  /** The QA's answers are requirements the plan may not hold yet: the chat's agent should know them. */
  it('tells what the latest run asked the QA and how it ended, a secret by its name alone', () => {
    const [latest] = runHistoryOf({
      workspace: {
        runs: [
          {
            ...RUN,
            asked: [
              {
                id: 'q-1',
                question: 'Which plan should I pick?',
                caseId: 'TC-01',
                stepNumber: 2,
                answer: { kind: 'said', text: 'Premium+' },
                askedAtMs: 1,
                answeredAtMs: 2,
              },
              {
                id: 'q-2',
                question: 'What is the code texted to you?',
                caseId: 'TC-02',
                stepNumber: 1,
                answer: { kind: 'secret', name: 'OTP_CODE', isKept: false },
                askedAtMs: 3,
                answeredAtMs: 4,
              },
              {
                id: 'q-3',
                question: 'Is this banner expected?',
                caseId: 'TC-02',
                stepNumber: 2,
                answer: { kind: 'unanswered' },
                askedAtMs: 5,
                answeredAtMs: 6,
              },
            ],
          },
        ],
        chat: [],
      },
      wholePlan: 'The whole plan',
      exploration: 'Exploration',
    });

    expect(latest?.facts.slice(-3)).toEqual([
      'asked the QA at TC-01 step 2: Which plan should I pick? → they answered: Premium+',
      'asked the QA at TC-02 step 1: What is the code texted to you? → they typed a secret, as ${OTP_CODE} for that run only',
      'asked the QA at TC-02 step 2: Is this banner expected? → no answer came in time',
    ]);
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
