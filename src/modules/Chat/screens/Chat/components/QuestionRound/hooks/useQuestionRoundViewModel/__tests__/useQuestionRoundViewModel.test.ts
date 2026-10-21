// @vitest-environment jsdom
import type { IQuestionRoundProps } from '@/modules/Chat/screens/Chat/components/QuestionRound/types';
import type { IQuestionsMessage } from '@/modules/Chat/types';
import type { IChatQuestion } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useQuestionRoundViewModel } from '@/modules/Chat/screens/Chat/components/QuestionRound/hooks/useQuestionRoundViewModel';

const SCOPE: IChatQuestion = {
  header: 'Scope',
  question: 'What should the plan cover?',
  options: [
    { label: 'The landing page', description: 'What a visitor sees before installing.' },
    { label: 'The app', description: 'The phone app itself.' },
  ],
  isMultiSelect: false,
};

const FLOWS: IChatQuestion = {
  header: 'Flows',
  question: 'Which flows matter most?',
  options: [
    { label: 'Scanning a label', description: 'The score of one product.' },
    { label: 'Premium', description: 'Paying for more.' },
  ],
  isMultiSelect: true,
};

const GATE: IChatQuestion = {
  header: 'Plan',
  question: 'Two cases over the landing page, the app left out.',
  options: [{ label: 'Write the plan', description: 'The plan lands in the Plan tab.' }],
  isMultiSelect: false,
};

function round(props: { questions: IChatQuestion[] } & Partial<IQuestionsMessage>) {
  return { id: 'm-3', kind: 'questions' as const, at: '09:41', answers: null, ...props };
}

const ACCOUNT: IChatQuestion = {
  header: 'Account',
  question: 'Which account should the plan sign in with?',
  options: [
    { label: 'LOGIN_EMAIL', description: 'The admin the project keeps.' },
    {
      label: 'A new account',
      description: 'A seller, typed in a window.',
      variables: [
        { name: 'SELLER_EMAIL', description: 'A seller on staging' },
        { name: 'SELLER_PASSWORD', description: 'Its password' },
      ],
    },
  ],
  isMultiSelect: false,
};

function render(props: Partial<IQuestionRoundProps> & { message: IQuestionsMessage }) {
  const onAnswer = vi.fn();
  const view = renderHook(() =>
    useQuestionRoundViewModel({
      isAnswerable: true,
      onAnswer,
      onVariables: () => Promise.resolve(null),
      ...props,
    }),
  );

  return { onAnswer, view };
}

describe('useQuestionRoundViewModel', () => {
  describe('onPick', () => {
    it('picks one option of a question that takes one, and waits for the rest', () => {
      const { onAnswer, view } = render({
        message: round({ questions: [SCOPE, FLOWS] }),
      });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'The landing page' });
      });
      act(() => {
        view.result.current.onPick({ index: 0, label: 'The app' });
      });

      expect(
        view.result.current.questions[0]?.options.map(({ isPicked }) => isPicked),
      ).toEqual([false, true]);
      expect(view.result.current.canSend).toBe(false);
      expect(onAnswer).not.toHaveBeenCalled();
    });

    it('marks and unmarks the options of a question that takes several', () => {
      const { view } = render({ message: round({ questions: [SCOPE, FLOWS] }) });

      act(() => {
        view.result.current.onPick({ index: 1, label: 'Scanning a label' });
      });
      act(() => {
        view.result.current.onPick({ index: 1, label: 'Premium' });
      });
      act(() => {
        view.result.current.onPick({ index: 1, label: 'Scanning a label' });
      });

      expect(
        view.result.current.questions[1]?.options.map(({ isPicked }) => isPicked),
      ).toEqual([false, true]);
    });

    /**
     * The confirmation used to answer on the click of its lone option, while the card still showed
     * Answer and a field: the QA had no chance to add a word, nor to look before it went.
     */
    it('waits for Answer on the confirmation too, so the QA can add words after picking', () => {
      const { onAnswer, view } = render({ message: round({ questions: [GATE] }) });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'Write the plan' });
      });

      expect(onAnswer).not.toHaveBeenCalled();
      expect(view.result.current.canSend).toBe(true);

      act(() => {
        view.result.current.onText({ index: 0, text: 'and keep it short' });
      });
      act(() => {
        view.result.current.onSend();
      });

      expect(onAnswer).toHaveBeenCalledWith({
        messageId: 'm-3',
        answers: [{ picked: ['Write the plan'], text: 'and keep it short' }],
      });
    });

    /**
     * A round asking for an account offered "Write it in the field below": one click sent it with
     * the field still empty, and the agent asked for the account again.
     */
    it('waits for Answer on a lone question with several options, so the QA can write below', () => {
      const VALUES: IChatQuestion = {
        header: 'Account',
        question: 'Which account should the cases sign in with?',
        options: [
          { label: 'Write it in the field below', description: 'The cases use it.' },
          { label: 'Plan without signing in', description: 'Only what a visitor sees.' },
        ],
        isMultiSelect: false,
      };
      const { onAnswer, view } = render({ message: round({ questions: [VALUES] }) });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'Write it in the field below' });
      });

      expect(onAnswer).not.toHaveBeenCalled();

      act(() => {
        view.result.current.onText({ index: 0, text: 'qa@shop.test / Test-1234' });
      });
      act(() => {
        view.result.current.onSend();
      });

      expect(onAnswer).toHaveBeenCalledWith({
        messageId: 'm-3',
        answers: [
          { picked: ['Write it in the field below'], text: 'qa@shop.test / Test-1234' },
        ],
      });
    });

    it('does NOT change a round the QA can no longer answer', () => {
      const { onAnswer, view } = render({
        message: round({ questions: [GATE] }),
        isAnswerable: false,
      });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'Write the plan' });
      });

      expect(onAnswer).not.toHaveBeenCalled();
      expect(view.result.current.isOpen).toBe(false);
    });
  });

  describe('onSend', () => {
    it('sends every answer together once each question has one', () => {
      const { onAnswer, view } = render({
        message: round({ questions: [SCOPE, FLOWS] }),
      });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'The app' });
      });
      act(() => {
        view.result.current.onText({ index: 1, text: 'only the scanner' });
      });

      expect(view.result.current.canSend).toBe(true);

      act(() => {
        view.result.current.onSend();
      });

      expect(onAnswer).toHaveBeenCalledWith({
        messageId: 'm-3',
        answers: [
          { picked: ['The app'], text: '' },
          { picked: [], text: 'only the scanner' },
        ],
      });
    });

    it('does NOT send while a question has neither a pick nor words', () => {
      const { onAnswer, view } = render({
        message: round({ questions: [SCOPE, FLOWS] }),
      });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'The app' });
      });
      act(() => {
        view.result.current.onText({ index: 1, text: '   ' });
      });
      act(() => {
        view.result.current.onSend();
      });

      expect(onAnswer).not.toHaveBeenCalled();
    });
  });

  describe('an answered round', () => {
    it('shows only what the QA picked and wrote, and offers nothing more', () => {
      const { view } = render({
        message: round({
          questions: [{ ...SCOPE, isMultiSelect: true }],
          answers: [{ picked: ['The app'], text: ' the scanner first ' }],
        }),
        isAnswerable: false,
      });

      expect(view.result.current).toMatchObject({
        isAnswered: true,
        isOpen: false,
        canSend: false,
      });
      expect(view.result.current.questions[0]).toMatchObject({
        hint: '',
        said: 'the scanner first',
        options: [{ label: 'The app', isPicked: true }],
      });
    });
  });

  describe('onToggle', () => {
    const answered = (questions: IChatQuestion[]) =>
      render({
        message: round({
          questions,
          answers: questions.map(() => ({ picked: [], text: 'mine' })),
        }),
        isAnswerable: false,
      }).view;

    it('folds an answered round into one line that counts the questions answered', () => {
      const view = answered([SCOPE, FLOWS]);

      expect(view.result.current).toMatchObject({
        summary: 'You answered 2 questions',
        isExpanded: false,
        isBodyShown: false,
        caret: '▸',
      });
    });

    it('opens the answers on a click, and folds them again on the next', () => {
      const view = answered([SCOPE, FLOWS]);

      act(() => {
        view.result.current.onToggle();
      });

      expect(view.result.current).toMatchObject({ isBodyShown: true, caret: '▾' });

      act(() => {
        view.result.current.onToggle();
      });

      expect(view.result.current.isBodyShown).toBe(false);
    });

    it('counts a single question in the singular', () => {
      expect(answered([GATE]).result.current.summary).toBe('You answered 1 question');
    });

    it('does NOT fold a round still waiting for its answers', () => {
      const { view } = render({ message: round({ questions: [SCOPE] }) });

      act(() => {
        view.result.current.onToggle();
      });

      expect(view.result.current.isBodyShown).toBe(true);
    });
  });

  it('tells the QA when a question takes several options', () => {
    const { view } = render({ message: round({ questions: [SCOPE, FLOWS] }) });

    expect(view.result.current.questions.map(({ hint }) => hint)).toEqual([
      '',
      'Pick all that apply',
    ]);
  });
  describe('an option that creates variables', () => {
    it('says it opens a window for the variables, and which ones', () => {
      const { view } = render({ message: round({ questions: [ACCOUNT] }) });

      expect(view.result.current.questions[0]?.options.map(({ asks }) => asks)).toEqual([
        '',
        'Opens a window to type SELLER_EMAIL, SELLER_PASSWORD',
      ]);
    });

    it('opens the window, and picks the option with the names the QA kept', async () => {
      const onVariables = vi.fn(() =>
        Promise.resolve(['SELLER_EMAIL', 'SELLER_PASSWORD']),
      );
      const { onAnswer, view } = render({
        message: round({ questions: [ACCOUNT] }),
        onVariables,
      });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'A new account' });
      });

      expect(onVariables).toHaveBeenCalledWith(ACCOUNT.options[1]?.variables);

      await waitFor(() => {
        expect(view.result.current.questions[0]?.options[1]).toMatchObject({
          isPicked: true,
          kept: 'Kept: SELLER_EMAIL, SELLER_PASSWORD',
        });
      });

      act(() => {
        view.result.current.onSend();
      });

      expect(onAnswer).toHaveBeenCalledWith({
        messageId: 'm-3',
        answers: [
          {
            picked: ['A new account'],
            text: '',
            kept: ['SELLER_EMAIL', 'SELLER_PASSWORD'],
          },
        ],
      });
    });

    it('does NOT pick the option when the QA closed the window without saving', async () => {
      const onVariables = vi.fn(() => Promise.resolve(null));
      const { view } = render({ message: round({ questions: [ACCOUNT] }), onVariables });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'A new account' });
      });

      await waitFor(() => {
        expect(onVariables).toHaveBeenCalled();
      });
      expect(view.result.current.questions[0]?.options[1]?.isPicked).toBe(false);
      expect(view.result.current.canSend).toBe(false);
    });
  });
});
