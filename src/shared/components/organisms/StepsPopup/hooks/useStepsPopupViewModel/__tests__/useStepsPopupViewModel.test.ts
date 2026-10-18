// @vitest-environment jsdom
import type {
  IStepsPopupProps,
  StepsTone,
} from '@/shared/components/organisms/StepsPopup/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STEPS_POPUP } from '@/shared/components/organisms/StepsPopup/constants';
import { useStepsPopupViewModel } from '@/shared/components/organisms/StepsPopup/hooks/useStepsPopupViewModel';

function popup(tone: StepsTone, extra: Partial<IStepsPopupProps> = {}) {
  const props: IStepsPopupProps = {
    badge: null,
    tone,
    title: 'Title',
    subtitle: 'Subtitle',
    rows: [
      { key: 'one', label: 'One', state: 'done' },
      { key: 'two', label: 'Two', state: tone === 'failed' ? 'failed' : 'active' },
      { key: 'three', label: 'Three', state: 'pending' },
    ],
    hint: null,
    page: null,
    detail: null,
    code: null,
    actions: [],
    onCancel: vi.fn(),
    onClose: vi.fn(),
    ...extra,
  };

  return { props, ...renderHook(() => useStepsPopupViewModel(props)) };
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useStepsPopupViewModel', () => {
  describe('the rows', () => {
    it('marks each step by where it stands, and staggers them up to a ceiling', () => {
      const { result } = popup('failed');

      expect(result.current.rows.map(({ mark }) => mark)).toEqual(['✓', '✕', '']);
      expect(result.current.rows[1]?.className).toBe(
        'steps-popup__step steps-popup__step--failed',
      );
      expect(result.current.rows[1]?.delay).toBeGreaterThan(0);
      expect(
        Math.max(...result.current.rows.map(({ delay }) => delay)),
      ).toBeLessThanOrEqual(0.36);
    });

    it('swaps the badge for a check once connected, and a cross once failed', () => {
      expect(popup('working').result.current.badgeMark).toBeNull();
      expect(popup('connected').result.current.badgeMark).toBe('✓');
      expect(popup('failed').result.current.badgeMark).toBe('✕');
    });

    it('sets a command apart from an error', () => {
      expect(
        popup('failed', { detail: { text: 'claude /mcp', isCommand: true } }).result
          .current.detailClass,
      ).toBe('steps-popup__detail steps-popup__detail--command');
    });
  });

  describe('the code', () => {
    it('hands over the code typed, trimmed, and clears the field', () => {
      const onSubmit = vi.fn();
      const { result } = popup('working', {
        code: { label: 'Code', placeholder: 'code', submit: 'Send', onSubmit },
      });

      act(() => {
        result.current.onCodeChange('  abc-123  ');
      });

      expect(result.current.canSendCode).toBe(true);

      act(() => {
        result.current.onCodeSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith('abc-123');
      expect(result.current.code).toBe('');
    });

    it('does NOT send an empty code', () => {
      const onSubmit = vi.fn();
      const { result } = popup('working', {
        code: { label: 'Code', placeholder: 'code', submit: 'Send', onSubmit },
      });

      act(() => {
        result.current.onCodeChange('   ');
        result.current.onCodeSubmit();
      });

      expect(result.current.canSendCode).toBe(false);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('closing', () => {
    it('cancels on Escape while working, and closes on Escape after', () => {
      const working = popup('working');

      press('Escape');

      expect(working.props.onCancel).toHaveBeenCalledTimes(1);
      working.unmount();

      const failed = popup('failed');

      press('Escape');

      expect(failed.props.onClose).toHaveBeenCalledTimes(1);
      expect(failed.props.onCancel).not.toHaveBeenCalled();
    });

    it('does NOT close on a click outside while working', () => {
      const { result, props } = popup('working');

      result.current.onBackdrop();

      expect(props.onClose).not.toHaveBeenCalled();
    });

    it('closes on a click outside once it ended', () => {
      const { result, props } = popup('connected');

      result.current.onBackdrop();

      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on its own a moment after connecting', () => {
      vi.useFakeTimers();

      const { props } = popup('connected');

      act(() => {
        vi.advanceTimersByTime(STEPS_POPUP.closeAfterMs - 1);
      });

      expect(props.onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT close on its own while working', () => {
      vi.useFakeTimers();

      const { props } = popup('working');

      act(() => {
        vi.advanceTimersByTime(STEPS_POPUP.closeAfterMs * 10);
      });

      expect(props.onClose).not.toHaveBeenCalled();
    });
  });
});
