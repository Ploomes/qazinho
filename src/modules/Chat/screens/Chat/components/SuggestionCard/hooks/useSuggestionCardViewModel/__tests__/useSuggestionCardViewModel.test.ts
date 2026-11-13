// @vitest-environment jsdom
import type { ISuggestionMessage } from '@/modules/Chat/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSuggestionCardViewModel } from '@/modules/Chat/screens/Chat/components/SuggestionCard/hooks/useSuggestionCardViewModel';

const MESSAGE: ISuggestionMessage = {
  id: 'm-7',
  kind: 'suggestion',
  at: '10:02',
  runId: 'r-03',
  summary: 'Two screens. The cart total is wrong.',
  cases: [
    {
      title: 'Cart total adds the items',
      priority: 'P1',
      goal: '',
      preconditions: '',
      steps: [{ action: 'Open the cart', expected: 'Total R$ 79,90' }],
    },
    {
      title: 'Empty cart says so',
      priority: 'P3',
      goal: '',
      preconditions: '',
      steps: [{ action: 'Open the cart', expected: 'Your cart is empty' }],
    },
  ],
  isTaken: false,
};

afterEach(() => {
  cleanup();
});

describe('useSuggestionCardViewModel', () => {
  describe('what it shows', () => {
    it('names the exploration it came from, and lists each case with its priority', () => {
      const { result } = renderHook(() =>
        useSuggestionCardViewModel({ message: MESSAGE, onTake: vi.fn() }),
      );

      expect(result.current.eyebrow).toBe('Plan suggested by exploration r-03');
      expect(result.current.summary).toBe('Two screens. The cart total is wrong.');
      expect(
        result.current.cases.map(({ priority, title }) => `${priority} ${title}`),
      ).toEqual(['P1 Cart total adds the items', 'P3 Empty cart says so']);
    });
  });

  describe('onTake', () => {
    it('takes the suggestion into the plan', () => {
      const onTake = vi.fn();
      const { result } = renderHook(() =>
        useSuggestionCardViewModel({ message: MESSAGE, onTake }),
      );

      result.current.onTake();

      expect(onTake).toHaveBeenCalledWith({ messageId: 'm-7', only: [0, 1] });
    });

    /**
     * "Levar para o plano" levava os onze casos de uma vez, entre eles o do preço e o do
     * cupom que o plano já tinha.
     */
    it('takes only the cases the QA left on, and says how many', () => {
      const onTake = vi.fn();
      const { result, rerender } = renderHook(() =>
        useSuggestionCardViewModel({ message: MESSAGE, onTake }),
      );

      act(() => {
        result.current.cases[0]?.onChoose();
      });
      rerender();

      expect(result.current.takeLabel).toBe('Take 1 to the plan');

      act(() => {
        result.current.onTake();
      });

      expect(onTake).toHaveBeenCalledWith({ messageId: 'm-7', only: [1] });
    });

    it('does NOT take anything once every case was left out', () => {
      const onTake = vi.fn();
      const { result, rerender } = renderHook(() =>
        useSuggestionCardViewModel({ message: MESSAGE, onTake }),
      );

      act(() => {
        result.current.cases[0]?.onChoose();
        result.current.cases[1]?.onChoose();
      });
      rerender();

      expect(result.current.canTake).toBe(false);

      act(() => {
        result.current.onTake();
      });

      expect(onTake).not.toHaveBeenCalled();
    });

    it('does NOT take a suggestion twice', () => {
      const onTake = vi.fn();
      const { result } = renderHook(() =>
        useSuggestionCardViewModel({ message: { ...MESSAGE, isTaken: true }, onTake }),
      );

      result.current.onTake();

      expect(onTake).not.toHaveBeenCalled();
      expect(result.current.isTaken).toBe(true);
    });
  });

  it('says it came from the coding agent, with no run to name', () => {
    const { result } = renderHook(() =>
      useSuggestionCardViewModel({
        message: {
          id: 'm-1',
          kind: 'suggestion',
          at: '10:00',
          runId: '',
          summary: 'New coupon',
          cases: [],
          isTaken: false,
          from: 'outside',
        },
        onTake: () => undefined,
      }),
    );

    expect(result.current.eyebrow).toBe('Suggested by your coding agent');
  });
});
