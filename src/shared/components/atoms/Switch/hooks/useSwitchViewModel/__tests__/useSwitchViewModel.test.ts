// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SWITCH } from '@/shared/components/atoms/Switch/constants';
import { useSwitchViewModel } from '@/shared/components/atoms/Switch/hooks/useSwitchViewModel';

const PROPS = { label: 'Network', isOn: false, onChange: () => undefined };

describe('useSwitchViewModel', () => {
  describe('onSwitchClick', () => {
    it('turns an off switch on', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useSwitchViewModel({ ...PROPS, onChange }));

      result.current.onSwitchClick();

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('turns an on switch off, and never asks for the state it already has', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useSwitchViewModel({ ...PROPS, isOn: true, onChange }),
      );

      result.current.onSwitchClick();

      expect(onChange).toHaveBeenCalledWith(false);
      expect(onChange).not.toHaveBeenCalledWith(true);
    });
  });

  describe('knob', () => {
    it('rests at the start while off and slides the whole way once on', () => {
      expect(renderHook(() => useSwitchViewModel(PROPS)).result.current.knob).toEqual({
        x: 0,
      });
      expect(
        renderHook(() => useSwitchViewModel({ ...PROPS, isOn: true })).result.current
          .knob,
      ).toEqual({ x: SWITCH.travelPx });
    });

    it('slides as far as the track leaves room for, past its edges', () => {
      expect(SWITCH.widthPx - SWITCH.knobPx - SWITCH.travelPx).toBe(6);
    });
  });

  describe('className', () => {
    it('marks the switch on only while it is', () => {
      expect(renderHook(() => useSwitchViewModel(PROPS)).result.current.className).toBe(
        'switch',
      );
      expect(
        renderHook(() => useSwitchViewModel({ ...PROPS, isOn: true })).result.current
          .className,
      ).toBe('switch switch--on');
    });

    it('hides the label from sight, never from a screen reader, in a row that names it', () => {
      expect(
        renderHook(() => useSwitchViewModel({ ...PROPS, isLabelHidden: true })).result
          .current,
      ).toMatchObject({
        className: 'switch switch--bare',
        labelClassName: 'switch__label switch__label--hidden',
      });
      expect(
        renderHook(() => useSwitchViewModel(PROPS)).result.current.labelClassName,
      ).toBe('switch__label');
    });
  });

  describe('icon', () => {
    it('draws an icon only when one was named', () => {
      expect(renderHook(() => useSwitchViewModel(PROPS)).result.current.hasIcon).toBe(
        false,
      );
      expect(
        renderHook(() => useSwitchViewModel({ ...PROPS, icon: 'network' })).result
          .current,
      ).toMatchObject({ hasIcon: true, icon: 'network' });
    });
  });
});
