// @vitest-environment jsdom
import type { KeyboardEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useToolCardViewModel } from '@/modules/Setup/screens/Onboarding/components/ToolCard/hooks/useToolCardViewModel';

const CARD = { name: 'Codex', about: '', detail: '', state: 'found' as const, badge: '' };

function pressed(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLDivElement>;
}

describe('useToolCardViewModel', () => {
  describe('className', () => {
    it('marks a found tool that can be picked as an option, and the picked one as selected', () => {
      const picked = renderHook(() =>
        useToolCardViewModel({ ...CARD, isSelected: true, onSelect: vi.fn() }),
      );

      expect(picked.result.current.className).toBe(
        'tool-card tool-card--found tool-card--option tool-card--selected',
      );
    });

    it('does NOT make a missing tool an option, since there is nothing to pick', () => {
      const { result } = renderHook(() =>
        useToolCardViewModel({ ...CARD, state: 'missing', onSelect: vi.fn() }),
      );

      expect(result.current.isOption).toBe(false);
      expect(result.current.className).toBe('tool-card tool-card--missing');
    });
  });

  describe('onClick', () => {
    it('picks the tool', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useToolCardViewModel({ ...CARD, onSelect }));

      result.current.onClick();

      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('does NOT pick again the tool already picked', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useToolCardViewModel({ ...CARD, isSelected: true, onSelect }),
      );

      result.current.onClick();

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('onKeyDown', () => {
    it('picks the tool with Enter or Space, as a radio does', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useToolCardViewModel({ ...CARD, onSelect }));

      result.current.onKeyDown(pressed('Enter'));
      result.current.onKeyDown(pressed(' '));

      expect(onSelect).toHaveBeenCalledTimes(2);
    });

    it('ignores any other key', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() => useToolCardViewModel({ ...CARD, onSelect }));

      result.current.onKeyDown(pressed('a'));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
