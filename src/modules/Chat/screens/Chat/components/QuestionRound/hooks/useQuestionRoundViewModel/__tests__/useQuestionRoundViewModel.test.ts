// @vitest-environment jsdom
import type { IQuestionRoundProps } from '@/modules/Chat/screens/Chat/components/QuestionRound/types';
import type { IQuestionsMessage } from '@/modules/Chat/types';
import type { IChatQuestion } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
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

function render(props: Partial<IQuestionRoundProps> & { message: IQuestionsMessage }) {
  const onAnswer = vi.fn();
  const view = renderHook(() =>
    useQuestionRoundViewModel({ isAnswerable: true, onAnswer, ...props }),
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

    it('answers at once a round of one question that takes one option', () => {
      const { onAnswer, view } = render({ message: round({ questions: [GATE] }) });

      act(() => {
        view.result.current.onText({ index: 0, text: 'and keep it short' });
      });
      act(() => {
        view.result.current.onPick({ index: 0, label: 'Write the plan' });
      });

      expect(onAnswer).toHaveBeenCalledWith({
        messageId: 'm-3',
        answers: [{ picked: ['Write the plan'], text: 'and keep it short' }],
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
        eyebrow: 'Answered',
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

  it('tells the QA when a question takes several options', () => {
    const { view } = render({ message: round({ questions: [SCOPE, FLOWS] }) });

    expect(view.result.current.questions.map(({ hint }) => hint)).toEqual([
      '',
      'Pick all that apply',
    ]);
  });
});
