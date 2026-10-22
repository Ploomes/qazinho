import { describe, expect, it } from 'vitest';
import { answerWords } from '@/main/classes/runs/RunCoordinator/library';

const NEXT = { carryOn: 'Carry on with step 2.', noAnswer: 'Report the step blocked.' };

describe('answerWords', () => {
  it("hands over the QA's words as they wrote them, then what comes next", () => {
    expect(
      answerWords({
        answer: { kind: 'said', text: 'Premium+\nthe yearly one' },
        ...NEXT,
      }),
    ).toBe('The QA answered:\nPremium+\nthe yearly one\n\nCarry on with step 2.');
  });

  /** The agent must type the name and never learn the value: the words carry nothing else. */
  it('names a secret by its variable alone', () => {
    const said = answerWords({
      answer: { kind: 'secret', name: 'OTP_CODE', isKept: false },
      ...NEXT,
    });

    expect(said).toBe(
      'The QA typed the answer as a secret: write ${OTP_CODE} where it goes, and QAzinho types its value. You never see it. Carry on with step 2.',
    );
  });

  it('says no answer came, and what to do without one', () => {
    expect(answerWords({ answer: { kind: 'unanswered' }, ...NEXT })).toBe(
      'The QA did not answer in time. Report the step blocked.',
    );
  });

  it('ends the turn when the QA stopped the run first', () => {
    expect(answerWords({ answer: { kind: 'stopped' }, ...NEXT })).toBe(
      'The QA stopped the run: end your turn now.',
    );
  });
});
