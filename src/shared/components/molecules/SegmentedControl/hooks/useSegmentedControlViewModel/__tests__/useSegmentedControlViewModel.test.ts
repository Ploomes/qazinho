// @vitest-environment jsdom
import type { KeyboardEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSegmentedControlViewModel } from '@/shared/components/molecules/SegmentedControl/hooks/useSegmentedControlViewModel';

const OPTIONS = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: 'always', label: 'Always' },
];

function setup(value: string) {
  const onChange = vi.fn();
  const { result } = renderHook(() =>
    useSegmentedControlViewModel({
      label: 'Keep videos for',
      options: OPTIONS,
      value,
      onChange,
    }),
  );

  return { onChange, result };
}

/** Os botões de verdade, para o teclado poder levar o foco ao vizinho. */
function radios() {
  const group = document.createElement('div');
  const buttons = OPTIONS.map(() => {
    const button = document.createElement('button');

    button.setAttribute('role', 'radio');
    group.appendChild(button);

    return button;
  });

  document.body.appendChild(group);

  return buttons;
}

const keyOn = (button: HTMLButtonElement, key: string) => {
  const preventDefault = vi.fn();

  return {
    event: {
      key,
      currentTarget: button,
      preventDefault,
    } as unknown as KeyboardEvent<HTMLButtonElement>,
    preventDefault,
  };
};

describe('useSegmentedControlViewModel', () => {
  describe('items', () => {
    it('marks the option that is picked, and only that one', () => {
      const { result } = setup('90');

      expect(result.current.items.map(({ isOn }) => isOn)).toEqual([
        false,
        false,
        true,
        false,
      ]);
      expect(result.current.items[2]?.className).toBe(
        'segmented__option segmented__option--on',
      );
    });

    it('lets the tab key reach the picked option alone, the way a radio group does', () => {
      const { result } = setup('30');

      expect(result.current.items.map(({ tabIndex }) => tabIndex)).toEqual([
        -1, 0, -1, -1,
      ]);
    });

    it('still lets the tab key in when nothing matches the value', () => {
      const { result } = setup('nothing');

      expect(result.current.items.map(({ tabIndex }) => tabIndex)).toEqual([
        0, -1, -1, -1,
      ]);
    });

    it('asks for its own option when one is clicked', () => {
      const { onChange, result } = setup('30');

      result.current.items[3]?.onPick();

      expect(onChange).toHaveBeenCalledExactlyOnceWith('always');
    });
  });

  describe('onItemKeyDown', () => {
    it('moves to the next option on the right arrow, and takes the focus along', () => {
      const buttons = radios();
      const { onChange, result } = setup('30');
      const { event, preventDefault } = keyOn(buttons[1]!, 'ArrowRight');

      result.current.onItemKeyDown(event);

      expect(onChange).toHaveBeenCalledExactlyOnceWith('90');
      expect(document.activeElement).toBe(buttons[2]);
      expect(preventDefault).toHaveBeenCalledOnce();
    });

    it('moves back on the left arrow', () => {
      const buttons = radios();
      const { onChange, result } = setup('30');

      result.current.onItemKeyDown(keyOn(buttons[1]!, 'ArrowLeft').event);

      expect(onChange).toHaveBeenCalledExactlyOnceWith('7');
    });

    it('wraps around at both ends', () => {
      const buttons = radios();
      const last = setup('always');
      const first = setup('7');

      last.result.current.onItemKeyDown(keyOn(buttons[3]!, 'ArrowRight').event);
      first.result.current.onItemKeyDown(keyOn(buttons[0]!, 'ArrowLeft').event);

      expect(last.onChange).toHaveBeenCalledExactlyOnceWith('7');
      expect(first.onChange).toHaveBeenCalledExactlyOnceWith('always');
    });

    it('does NOT pick anything on a key that is not an arrow', () => {
      const buttons = radios();
      const { onChange, result } = setup('30');
      const { event, preventDefault } = keyOn(buttons[1]!, 'a');

      result.current.onItemKeyDown(event);

      expect(onChange).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});
