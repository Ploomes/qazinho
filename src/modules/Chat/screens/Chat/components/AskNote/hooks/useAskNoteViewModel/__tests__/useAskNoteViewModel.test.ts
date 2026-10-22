// @vitest-environment jsdom
import type { IAskMessage } from '@/modules/Chat/types';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAskNoteViewModel } from '@/modules/Chat/screens/Chat/components/AskNote/hooks/useAskNoteViewModel';
import { EXPLORATION } from '@/shared/constants';

const MESSAGE: IAskMessage = {
  id: 'm-4',
  kind: 'ask',
  at: '10:02',
  runId: 'r-03',
  askId: 'q-1',
  question: 'Which plan should I pick?',
  caseId: 'TC-02',
  stepNumber: 3,
  answer: { kind: 'said', text: 'Premium+' },
};

const note = (message: Partial<IAskMessage>) =>
  renderHook(() => useAskNoteViewModel({ message: { ...MESSAGE, ...message } })).result
    .current;

afterEach(() => {
  cleanup();
});

describe('useAskNoteViewModel', () => {
  it("says what was asked at which step, and the QA's answer as they gave it", () => {
    expect(note({})).toMatchObject({
      label: 'Asked you',
      where: 'TC-02 · step 3',
      question: 'Which plan should I pick?',
      isAnswered: true,
      who: 'You',
      answer: 'Premium+',
      className: 'ask-note',
    });
  });

  /** The page never had the value back: the note can only name the variable. */
  it('names a secret by its variable, and says when the project keeps it', () => {
    expect(
      note({ answer: { kind: 'secret', name: 'OTP_CODE', isKept: false } }),
    ).toMatchObject({ isSecret: true, answer: 'a secret, typed as ${OTP_CODE}' });
    expect(
      note({ answer: { kind: 'secret', name: 'ADMIN_PASSWORD', isKept: true } }).answer,
    ).toBe('a secret, typed as ${ADMIN_PASSWORD} and kept in the project');
  });

  it('says no answer came, without putting words in the QA mouth', () => {
    expect(note({ answer: { kind: 'unanswered' } })).toMatchObject({
      isAnswered: false,
      answer: 'No answer in time: the agent went on without it',
      className: 'ask-note ask-note--unanswered',
    });
    expect(note({ answer: { kind: 'stopped' } }).answer).toBe(
      'The run stopped before an answer',
    );
  });

  it('says the screen an exploration was on, and nothing before the first one', () => {
    expect(note({ caseId: EXPLORATION.caseId, stepNumber: 4 }).where).toBe('screen 4');
    expect(note({ caseId: EXPLORATION.caseId, stepNumber: 0 }).where).toBe('');
  });
});
