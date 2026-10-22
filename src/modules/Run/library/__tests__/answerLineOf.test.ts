import { describe, expect, it } from 'vitest';
import { answerLineOf } from '@/modules/Run/library';

describe('answerLineOf', () => {
  it("keeps the QA's own words as they gave them", () => {
    expect(answerLineOf({ kind: 'said', text: 'Premium+' })).toEqual({
      kind: 'words',
      text: 'Premium+',
    });
  });

  /** The page never has a secret's value: all it can say is the name it went as. */
  it('names a secret by its variable, kept in the project or not', () => {
    expect(answerLineOf({ kind: 'secret', name: 'OTP_CODE', isKept: false })).toEqual({
      kind: 'sentence',
      key: 'RUN.ANSWERED_SECRET',
      name: '${OTP_CODE}',
    });
    expect(
      answerLineOf({ kind: 'secret', name: 'ADMIN_PASSWORD', isKept: true }),
    ).toMatchObject({ key: 'RUN.ANSWERED_SECRET_KEPT' });
  });

  it('says no answer came, or that the run stopped first', () => {
    expect(answerLineOf({ kind: 'unanswered' })).toMatchObject({
      key: 'RUN.ANSWERED_NONE',
    });
    expect(answerLineOf({ kind: 'stopped' })).toMatchObject({
      key: 'RUN.ANSWERED_STOPPED',
    });
  });
});
