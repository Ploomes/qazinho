import type { IChatQuestion } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { answerRound, appendQuestions, formatAnswers } from '@/modules/Chat/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const SCOPE: IChatQuestion = {
  header: 'Scope',
  question: 'What should the plan cover?',
  options: [
    { label: 'The landing page', description: 'What a visitor sees before installing.' },
    { label: 'The app', description: 'The phone app itself.' },
  ],
  isMultiSelect: false,
};

const ACCOUNT: IChatQuestion = {
  header: 'Account',
  question: 'Which account do the steps sign in with?',
  options: [
    { label: 'Write it below', description: 'The steps sign in with it.' },
    { label: 'Plan without signing in', description: 'Only what a visitor sees.' },
  ],
  isMultiSelect: false,
};

describe('appendQuestions', () => {
  it('adds the round to the chat, waiting for the QA', () => {
    const workspace = appendQuestions({
      workspace: makeWorkspace([]),
      questions: [SCOPE],
      at: '09:41',
    });

    expect(workspace.chat).toEqual([
      { id: 'm-1', kind: 'questions', at: '09:41', questions: [SCOPE], answers: null },
    ]);
  });

  it('does NOT add an empty round', () => {
    const workspace = makeWorkspace([]);

    expect(appendQuestions({ workspace, questions: [], at: '09:41' })).toBe(workspace);
  });
});

describe('answerRound', () => {
  it('keeps the answers on the round they answer', () => {
    const asked = appendQuestions({
      workspace: makeWorkspace([]),
      questions: [SCOPE],
      at: '09:41',
    });
    const answers = [{ picked: ['The app'], text: '' }];

    expect(
      answerRound({ workspace: asked, messageId: 'm-1', answers }).chat[0],
    ).toMatchObject({ kind: 'questions', answers });
  });

  it('does NOT answer a round twice', () => {
    const asked = appendQuestions({
      workspace: makeWorkspace([]),
      questions: [SCOPE],
      at: '09:41',
    });
    const first = answerRound({
      workspace: asked,
      messageId: 'm-1',
      answers: [{ picked: ['The app'], text: '' }],
    });
    const again = answerRound({
      workspace: first,
      messageId: 'm-1',
      answers: [{ picked: ['The landing page'], text: '' }],
    });

    expect(again.chat[0]).toMatchObject({ answers: [{ picked: ['The app'] }] });
  });
});

describe('formatAnswers', () => {
  it('names the variables the QA kept through an option, never their values', () => {
    expect(
      formatAnswers({
        questions: [ACCOUNT],
        answers: [
          {
            picked: ['A new account'],
            text: '',
            kept: ['SELLER_EMAIL', 'SELLER_PASSWORD'],
          },
        ],
      }),
    ).toBe(
      'Account (Which account do the steps sign in with?): A new account — kept the variables ${SELLER_EMAIL}, ${SELLER_PASSWORD}',
    );
  });

  it('says each answer under its question, what was picked before what was written', () => {
    expect(
      formatAnswers({
        questions: [SCOPE, ACCOUNT],
        answers: [
          { picked: ['The app'], text: '' },
          { picked: ['Write it below'], text: '  qa@shop.test / hunter2 ' },
        ],
      }),
    ).toBe(
      [
        'Scope (What should the plan cover?): The app',
        'Account (Which account do the steps sign in with?): Write it below — qa@shop.test / hunter2',
      ].join('\n'),
    );
  });

  it('takes the words alone when the QA picked nothing', () => {
    expect(
      formatAnswers({
        questions: [SCOPE],
        answers: [{ picked: [], text: 'Both, the app first' }],
      }),
    ).toBe('Scope (What should the plan cover?): Both, the app first');
  });
});
