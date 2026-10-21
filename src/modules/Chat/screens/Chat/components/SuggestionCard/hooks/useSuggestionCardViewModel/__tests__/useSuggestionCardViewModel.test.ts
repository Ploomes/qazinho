// @vitest-environment jsdom
import type { ISuggestionMessage } from '@/modules/Chat/types';
import { cleanup, renderHook } from '@testing-library/react';
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

      expect(result.current.eyebrow).toBe('Suggested plan · r-03');
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

      expect(onTake).toHaveBeenCalledWith('m-7');
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
});
