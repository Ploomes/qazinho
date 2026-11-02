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
  describe('one question at a time', () => {
    /** Cinco perguntas de uma vez viravam um formulário numa coluna estreita. */
    it('shows only the question it is on, and how far along it is', () => {
      const { view } = render({ message: round({ questions: [SCOPE, FLOWS] }) });

      expect(view.result.current.questions.map(({ index }) => index)).toEqual([0]);
      expect(view.result.current).toMatchObject({
        hasPosition: true,
        position: '1 of 2',
      });
    });

    it('says nothing about position on a lone question', () => {
      const { view } = render({ message: round({ questions: [SCOPE] }) });

      expect(view.result.current.hasPosition).toBe(false);
    });

    it('goes on with one click on an option of a question that takes one', () => {
      const { onAnswer, view } = render({
        message: round({ questions: [SCOPE, FLOWS] }),
      });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'The app' });
      });

      expect(view.result.current.questions.map(({ index }) => index)).toEqual([1]);
      expect(onAnswer).not.toHaveBeenCalled();
    });

    /** Confirmar o plano pedia dois cliques: escolher a única opção, depois Responder. */
    it('sends the moment the last question takes its one click', () => {
      const { onAnswer, view } = render({ message: round({ questions: [GATE] }) });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'Write the plan' });
      });

      expect(onAnswer).toHaveBeenCalledWith({
        messageId: 'm-3',
        answers: [{ picked: ['Write the plan'], text: '' }],
      });
    });

    it('marks and unmarks the options of a question that takes several, and waits', () => {
      const { onAnswer, view } = render({ message: round({ questions: [FLOWS] }) });
      const picked = () =>
        view.result.current.questions[0]?.options
          .filter(({ isPicked }) => isPicked)
          .map(({ label }) => label);

      act(() => {
        view.result.current.onPick({ index: 0, label: 'Premium' });
      });

      expect(picked()).toEqual(['Premium']);
      expect(onAnswer).not.toHaveBeenCalled();
      expect(view.result.current).toMatchObject({ hasNext: true, canNext: true });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'Premium' });
      });

      expect(picked()).toEqual([]);
      expect(view.result.current.canNext).toBe(false);
    });

    it('goes back to change an answer', () => {
      const { view } = render({ message: round({ questions: [SCOPE, FLOWS] }) });

      expect(view.result.current.canBack).toBe(false);

      act(() => {
        view.result.current.onPick({ index: 0, label: 'The app' });
      });

      expect(view.result.current.canBack).toBe(true);

      act(() => {
        view.result.current.onBack();
      });

      expect(view.result.current.questions[0]?.options[1]?.isPicked).toBe(true);
    });

    it('does NOT change a round the QA can no longer answer', () => {
      const { onAnswer, view } = render({
        message: round({ questions: [SCOPE] }),
        isAnswerable: false,
      });

      act(() => {
        view.result.current.onPick({ index: 0, label: 'The app' });
      });

      expect(onAnswer).not.toHaveBeenCalled();
      expect(view.result.current.hasNext).toBe(false);
    });
  });

  describe('the QA’s own words', () => {
    it('opens the field only when asked, and sends what was typed', () => {
      const { onAnswer, view } = render({ message: round({ questions: [SCOPE] }) });

      expect(view.result.current.questions[0]?.isOwnOpen).toBe(false);

      act(() => {
        view.result.current.onOwn(0);
      });

      expect(view.result.current.questions[0]?.isOwnOpen).toBe(true);
      expect(view.result.current.canNext).toBe(false);

      act(() => {
        view.result.current.onText({ index: 0, text: 'The scanner first' });
      });
      act(() => {
        view.result.current.onNext();
      });

      expect(onAnswer).toHaveBeenCalledWith({
        messageId: 'm-3',
        answers: [{ picked: [], text: 'The scanner first' }],
      });
    });

    it('drops what was typed when the field closes', () => {
      const { view } = render({ message: round({ questions: [SCOPE] }) });

      act(() => {
        view.result.current.onOwn(0);
      });
      act(() => {
        view.result.current.onText({ index: 0, text: 'words' });
      });
      act(() => {
        view.result.current.onOwn(0);
      });

      expect(view.result.current.questions[0]?.text).toBe('');
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
        hasNext: false,
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
      });
    });

    it('opens the answers on a click, and folds them again on the next', () => {
      const view = answered([SCOPE, FLOWS]);

      act(() => {
        view.result.current.onToggle();
      });

      expect(view.result.current).toMatchObject({ isBodyShown: true, isExpanded: true });

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
    const { view } = render({ message: round({ questions: [FLOWS] }) });

    expect(view.result.current.questions[0]?.hint).toBe('Pick all that apply');
  });

  describe('an option that creates variables', () => {
    it('marks it with a lock, and names the variables on hover', () => {
      const { view } = render({ message: round({ questions: [ACCOUNT] }) });
      const [first, second] = view.result.current.questions[0]?.options ?? [];

      expect(first?.hasLock).toBe(false);
      expect(second?.hasLock).toBe(true);
      expect(second?.tip).toContain('SELLER_EMAIL, SELLER_PASSWORD');
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
        expect(onAnswer).toHaveBeenCalled();
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
      expect(view.result.current.canNext).toBe(false);
    });
  });
});
