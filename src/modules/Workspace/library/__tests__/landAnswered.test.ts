import type { IRunAsked } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { landAnswered, landAsked } from '@/modules/Workspace/library';
import { QUESTION, walkRun } from './fixtures';

const ANSWERED: IRunAsked = {
  id: 'q-1',
  question: 'Which plan should I pick?',
  caseId: 'TC-01',
  stepNumber: 2,
  answer: { kind: 'said', text: 'Premium+' },
  askedAtMs: 1_760_000_004_000,
  answeredAtMs: 1_760_000_034_000,
};

const waiting = () =>
  landAsked({ workspace: walkRun({ verdicts: ['passed'] }), question: QUESTION });

describe('landAnswered', () => {
  it('lets the run go on, and keeps how the question ended for its step', () => {
    const answered = landAnswered({ workspace: waiting(), asked: ANSWERED, at: '09:42' });

    expect(answered.live?.question).toBeUndefined();
    expect(answered.live?.asked).toEqual([ANSWERED]);
  });

  it("says once in the run's section what was asked and how it was answered", () => {
    const once = landAnswered({ workspace: waiting(), asked: ANSWERED, at: '09:42' });
    const twice = landAnswered({ workspace: once, asked: ANSWERED, at: '09:43' });

    expect(twice.chat.filter(({ kind }) => kind === 'ask')).toEqual([
      {
        id: 'm-1',
        kind: 'ask',
        at: '09:42',
        runId: 'r-01',
        askId: 'q-1',
        question: 'Which plan should I pick?',
        caseId: 'TC-01',
        stepNumber: 2,
        answer: { kind: 'said', text: 'Premium+' },
      },
    ]);
    expect(twice.live?.asked).toEqual([ANSWERED]);
  });

  it('does NOT let go of a newer question for the end of an older one', () => {
    const newer = landAsked({
      workspace: waiting(),
      question: { ...QUESTION, id: 'q-2' },
    });

    expect(
      landAnswered({ workspace: newer, asked: ANSWERED, at: '09:42' }).live?.question?.id,
    ).toBe('q-2');
  });

  it('does NOT touch a run that is over', () => {
    const over = walkRun({ verdicts: ['passed'], isFinished: true });

    expect(landAnswered({ workspace: over, asked: ANSWERED, at: '09:42' })).toBe(over);
  });
});
